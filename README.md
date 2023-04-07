# cloudflare-azure-openai-proxy

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE) [![Version](https://img.shields.io/badge/version-1.0.0-blue)](VERSION) [![Node.js](https://img.shields.io/badge/node.js->=14.x-brightgreen)](https://nodejs.org)


A Cloudflare Worker for Proxying the OpenAI API to Azure's OpenAI API

## Main Features

- Support OpenAI's Stream mode
- Support custom mapping between Azure deployment name and OpenAI model
- Utilize CloudFlare Workers KV for data storage
- Deploy with Wrangler

## Installation

### Prerequisites

- Node.js >= 14.x
- npm >= 6.x

### Installation Steps

1. Clone the project to your local machine:

   ```bash
   git clone https://github.com/coolxyz/cloudflare-azure-openai-proxy.git
   ```

2. Enter the project directory and install the dependencies:

   ```bash
   cd cloudflare-azure-openai-proxy
   npm install
   ```

3. Login to Cloudflare:

   ```bash
   npx wrangler login
   ```

4. Create a KV namespace with Wrangler:

   ```bash
   npx wrangler kv:namespace create AZURE_OPENAI
   ```

   And then you will get a namespace id like `e29b263ab50e42ce9b637fa8370175e8`, replace the following code to `wrangler.toml`:
   
   ```toml
   kv_namespaces = [
       { binding = "AZURE_OPENAI", id = "e29b263ab50e42ce9b637fa8370175e8" }
   ]
   ```
   
5. Run the following commands to store the data of your own Azure OpenAI resource name and mapping between OpenAI model name and Azure OpenAI model name:

   ```bash
   npx wrangler kv:key put --binding=AZURE_OPENAI "resource-name" "<YOUR_RESOURCE_NAME>"
   npx wrangler kv:key put --binding=AZURE_OPENAI "api-version" "2023-03-15-preview"
   npx wrangler kv:key put --binding=AZURE_OPENAI "model-map" "{\"gpt-3.5-turbo\":\"<YOUR_MODEL_1>\",\"gpt-4\":\"<YOUR_MODEL_2>\"}"
   ```

6. Deploy the worker:

   ```bash
   npx wrangler publish
   ```

## Usage

In your frequently used ChatGPT client, fill in your Cloudflare Worker address in the custom OpenAI API address section.
For example: https://<YOUR_WORKER_NAME>.<YOUR_WORKER_ZONE>.workers.dev/

