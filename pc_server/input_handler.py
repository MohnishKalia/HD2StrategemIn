# input_handler.py

import time
import logging

logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)

try:
    import pyautogui
    USE_PYAUTOGUI = True
except ImportError:
    USE_PYAUTOGUI = False
    logging.warning("pyautogui not installed. Key presses will be simulated.")

def press_key(key_name: str):
    """
    Presses and releases the given key_name via pyautogui.
    """
    logging.info(f"Pressing key: {key_name}")
    if USE_PYAUTOGUI:
        # pyautogui uses key names like 'f1', 'f2', 'left', 'up', etc.
        pyautogui.press(key_name.lower())
    else:
        # Fallback: just log
        logging.debug(f"Would have pressed: {key_name}")
    
    # Give a small pause for key registration
    time.sleep(0.05)

def press_key_down(key_name: str):
    """
    Presses and holds down the given key_name via pyautogui.
    """
    logging.info(f"Pressing key DOWN: {key_name}")
    if USE_PYAUTOGUI:
        pyautogui.keyDown(key_name.lower())
    else:
        logging.debug(f"Would have pressed DOWN: {key_name}")

def release_key(key_name: str):
    """
    Releases the given key_name via pyautogui.
    """
    logging.info(f"Releasing key UP: {key_name}")
    if USE_PYAUTOGUI:
        pyautogui.keyUp(key_name.lower())
    else:
        logging.debug(f"Would have released UP: {key_name}")
