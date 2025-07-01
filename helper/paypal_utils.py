import os
import base64
import requests
import httpx
from dotenv import load_dotenv

load_dotenv()

PAYPAL_ENVIRONMENT = os.getenv("PAYPAL_ENVIRONMENT", "live")
CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")

BASE_URL = "https://api-m.paypal.com"

async def get_paypal_access_token():
    print("Client Id and Client Secret", CLIENT_ID, CLIENT_SECRET)
    auth = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/v1/oauth2/token", headers=headers, data=data)
        response.raise_for_status()
        return response.json()["access_token"]