import os
import base64
import requests
import httpx
from dotenv import load_dotenv
from paypalcheckoutsdk.core import LiveEnvironment, PayPalHttpClient, SandboxEnvironment

load_dotenv()

PAYPAL_ENVIRONMENT = os.getenv("PAYPAL_ENVIRONMENT", "sandbox")
CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")

def get_paypal_client():
    env_mode = PAYPAL_ENVIRONMENT.lower()
    if env_mode == "sandbox":
        environment = SandboxEnvironment(client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    else:
        environment = LiveEnvironment(client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    return PayPalHttpClient(environment)

def get_paypal_base_url():
    return "https://api-m.sandbox.paypal.com" if PAYPAL_ENVIRONMENT == "sandbox" else "https://api-m.paypal.com"

async def get_paypal_access_token():
    print("🔐 Fetching PayPal access token using", PAYPAL_ENVIRONMENT.upper(), "credentials")
    auth = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{get_paypal_base_url()}/v1/oauth2/token", headers=headers, data=data)
        response.raise_for_status()
        return response.json()["access_token"]