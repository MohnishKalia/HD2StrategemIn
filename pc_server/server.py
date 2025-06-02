# server.py

import asyncio
import json
from websockets import serve
import logging

from config import WS_HOST, WS_PORT
from input_handler import press_key, press_key_down, release_key

logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)

async def handle_connection(websocket):
    # Per-connection CTRL state
    ctrl_key_active_for_this_connection = False
    client_address = websocket.remote_address
    logging.info(f"Client connected: {client_address}")

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                logging.error(f"Invalid JSON received from {client_address}: {message}")
                continue

            if "button" in data:
                btn = data["button"].upper()
                if btn in {"UP", "DOWN", "LEFT", "RIGHT"}:
                    # CTRL state is now managed by ctrlState messages, so just press the button
                    logging.info(f"Executing key press: {btn} (CTRL held by server: {ctrl_key_active_for_this_connection})")
                    press_key(btn.lower())
            
            elif "key" in data:
                key = data["key"]
                logging.info(f"Executing key press: {key} from {client_address}")
                press_key(key.lower())

            elif "ctrlState" in data:
                new_ctrl_state = data["ctrlState"]
                if new_ctrl_state != ctrl_key_active_for_this_connection:
                    ctrl_key_active_for_this_connection = new_ctrl_state
                    if ctrl_key_active_for_this_connection:
                        logging.info(f"CTRL key HELD DOWN by server for {client_address}.")
                        press_key_down('ctrl')
                    else:
                        logging.info(f"CTRL key RELEASED by server for {client_address}.")
                        release_key('ctrl')
                else:
                    logging.info(f"Received redundant CTRL state ({new_ctrl_state}) from {client_address}. No change in physical key state.")

    except asyncio.CancelledError:
        logging.info(f"Connection with {client_address} cancelled.")
    except Exception as e:
        logging.error(f"Connection error with {client_address}: {e}")
    finally:
        # Ensure CTRL is released if connection drops while it was active for this client
        if ctrl_key_active_for_this_connection:
            release_key('ctrl')
            logging.info(f"CTRL key released for {client_address} due to disconnect or error.")
        logging.info(f"Client disconnected: {client_address}")

async def main():
    logging.info(f"Starting WebSocket server on {WS_HOST}:{WS_PORT}")
    async with serve(handle_connection, WS_HOST, WS_PORT):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
