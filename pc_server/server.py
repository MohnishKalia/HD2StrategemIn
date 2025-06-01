# server.py

import asyncio
import json
from websockets import serve
import logging

from config import WS_HOST, WS_PORT
from input_handler import press_key

logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)

async def handle_connection(websocket):
    logging.info(f"Client connected: {websocket.remote_address}")

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                logging.error(f"Invalid JSON received: {message}")
                continue

            # Directly handle button presses from the client
            if "button" in data:
                btn = data["button"].upper()
                if btn in {"UP", "DOWN", "LEFT", "RIGHT"}:
                    logging.info(f"Executing key press: {btn}")
                    press_key(btn.lower())  # Pass the key directly to the input handler
            
            # Also handle individual key presses for other commands (e.g. ESC to cancel)
            elif "key" in data:
                key = data["key"]
                logging.info(f"Executing key press: {key}")
                press_key(key.lower())

    except asyncio.CancelledError:
        pass
    except Exception as e:
        logging.error(f"Connection error: {e}")
    finally:
        logging.info(f"Client disconnected: {websocket.remote_address}")

async def main():
    logging.info(f"Starting WebSocket server on {WS_HOST}:{WS_PORT}")
    async with serve(handle_connection, WS_HOST, WS_PORT):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
