/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	AZURE_OPENAI: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'OPTIONS') {
      return handleOPTIONS(request)
    }

    return handleRequest(request, env);
  },
};

const handleRequest = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  if (url.pathname === '/v1/models') {
    return handleModels(request)
  }

  if (request.method !== 'POST') {
    return new Response('404 Not Found', { status: 404 });
  }

  if (url.pathname === '/v1/chat/completions') {
    var path="chat/completions"
  } else if (url.pathname === '/v1/completions') {
    var path="completions"
  } else {
    return new Response('404 Not Found', { status: 404 });
  }
 
  const apiVersion = await env.AZURE_OPENAI.get('api-version');
  const resourceName = await env.AZURE_OPENAI.get('resource-name');
  if (!resourceName) {
    return new Response('404 Not Found', { status: 404 });
  }

  const body: any = await request.json();

  const modelMap: any = await env.AZURE_OPENAI.get('model-map', { type: 'json' });
  const deployName = modelMap[body.model];
  if (!deployName) {
    return new Response('404 Not Found', { status: 404 });
  }

  const authKey = request.headers.get('Authorization');
  if (!authKey) {
    return new Response("Not allowed", { status: 403 });
  }

  const payload = {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      "api-key": authKey.replace('Bearer ', ''),
    },
    body: typeof body === 'object' ? JSON.stringify(body) : '{}',
  };

  const fetchAPI = `https://${resourceName}.openai.azure.com/openai/deployments/${deployName}/${path}?api-version=${apiVersion}`

  const response = await fetch(fetchAPI, payload);

  const contentType = response.headers.get('Content-Type');
  if (contentType === 'text/event-stream' && response.body) {
    const newline = new TextEncoder().encode('\n');
    const { readable, writable } = new TransformStream();

    response.body.pipeTo(writable);

    const modifiedStream = new ReadableStream({
      async start(controller) {
        const reader = readable.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(newline);
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch (error) {
          console.error(error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(modifiedStream, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }
  return response
}

const handleModels = async (request: Request) => {
  const data = {
    "object": "list",
    "data": [ {
      "id": "gpt-3.5-turbo",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai",
      "permission": [{
        "id": "modelperm-M56FXnG1AsIr3SXq8BYPvXJA",
        "object": "model_permission",
        "created": 1679602088,
        "allow_create_engine": false,
        "allow_sampling": true,
        "allow_logprobs": true,
        "allow_search_indices": false,
        "allow_view": true,
        "allow_fine_tuning": false,
        "organization": "*",
        "group": null,
        "is_blocking": false
      }],
      "root": "gpt-3.5-turbo",
      "parent": null
    }]
  };
  const json = JSON.stringify(data, null, 2);
  return new Response(json, {
    headers: { 'Content-Type': 'application/json' },
  });
}

const handleOPTIONS = async (request: Request)=> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*'
    }
  })
}
