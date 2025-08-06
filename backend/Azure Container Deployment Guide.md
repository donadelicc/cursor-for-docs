# Azure Deployment Guide: FastAPI as an Azure Container App

This document outlines the process for deploying and updating the containerized Python FastAPI application to **Azure Container Apps**.

---

## Core Concepts & Naming

Our deployment relies on several key Azure services working together.

* **Resource Group**: A logical folder for all our Azure resources.
    * **Our Name**: `useful-backend`

* **Container Registry (ACR)**: A private warehouse (like a private Docker Hub) where we store our packaged application "blueprints" (Docker images).
    * **Our Name**: `usefulbackendacr`

* **Container App**: The service that acts as the "factory." It pulls the blueprint from the registry and runs our application, making it accessible on the internet.
    * **Our Name**: `useful-api`

* **Container Image**: The packaged blueprint of our application, built from the `Dockerfile`. We give it a version tag each time we build it (e.g., `:v1`, `:v2`).
    * **Our Image Name**: `useful-api`

---

## How to Deploy a New Version (Step-by-Step)

Follow these steps every time you make changes to the code and want to deploy an update.

### Step 1: Make Your Code Changes

Modify your Python (`.py`) files as needed for new features or bug fixes.

### Step 2: Build & Push the New Docker Image

Open a PowerShell terminal in your project's root directory. Remember to **increment the version tag** (e.g., from `:v1` to `:v2`) to keep track of your deployments.

```powershell
# 1. Log in to Azure Container Registry (if you've opened a new terminal)
az acr login --name usefulbackendacr

# 2. Build the new image with an updated version tag (e.g., v2)
docker build -t usefulbackendacr.azurecr.io/useful-api:v2 .

# 3. Push the new image to the registry
docker push usefulbackendacr.azurecr.io/useful-api:v2
```

### Step 3: Update the Container App
Tell your live useful-api app to stop using the old image and start using the new one you just pushed.

```powershell
# Update the container app to use the new image version
az containerapp update `
  --name useful-api `
  --resource-group useful-backend `
  --image usefulbackendacr.azurecr.io/useful-api:v2
```
### Step 4: Verify the Deployment
It usually takes 2-5 minutes for the update to complete. You can monitor the logs to see your new application start up.

```powershell
# View the live logs of your application
az containerapp logs show --name useful-api --resource-group useful-backend
```

## Important Information for Future Use

### Managing Environment Variables (Secrets)
Your application will eventually need secrets like API keys or database connection strings. Never write these directly in your code or Dockerfile. This can be added easily in the Azure extension in VSCode by importing the .env fil.

Or you can add them  to your Container App via the command line:

```powershell
# The 'secret' flag ensures the value is encrypted at rest.
az containerapp secret set `
  --name useful-api `
  --resource-group useful-backend `
  --secrets "my-api-key=YOUR_SECRET_VALUE_HERE"
  ```
Then, you must update your app to pass that secret to your container as an environment variable.
```powershell
az containerapp update `
  --name useful-api `
  --resource-group useful-backend `
  --set-env-vars "API_KEY=secretref:my-api-key"
```

To see if the environment variales where added 
```powershell
az containerapp show `
  --name useful-api `
  --resource-group useful-backend `
  --query "properties.template.containers[0].env" `
  --output table
```

### Automation with CI/CD
The manual process of building, pushing, and updating is great for getting started. The next level is to automate this entire workflow using GitHub Actions.

You can create a workflow file (e.g., .github/workflows/deploy.yml) that tells GitHub to automatically run all these commands every time you push code to your main branch. This is called Continuous Integration/Continuous Deployment (CI/CD) and is the standard for professional development.