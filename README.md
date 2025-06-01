# Helldivers 2 Mobile Strategem Device

A mobile-friendly web UI and Python backend to allow users to send strategem input sequences (arrow keys) from a phone to a PC running Helldivers 2. The UI visually displays strategem progress, supports loadout selection, and provides immediate feedback for correct/incorrect input. The backend passes through keypresses to the game.

---

## Features

- **Mobile Web UI** (landscape, touch-optimized)
  - Arrow key input panel with visual feedback (green for correct, red for error)
  - Fixed-size input buffer box to prevent layout shift
  - Loadout panel: displays 4 strategems (random: 1 orbital, 1 eagle, 1 sentry, 1 power weapon)
  - Cooldown and activation time shown in muted text for each strategem
  - Tap any slot to change strategem (selector with categories)
  - Progress highlighting for input buffer
  - No right-side sequence bar, only left buffer row
  - No loadout button (tap slot to change)
- **Python WebSocket Backend**
  - Receives button/key events from client and simulates keypresses to Helldivers 2
  - Simple config for host/port
  - Uses `pyautogui` for keyboard input (can be swapped for vgamepad)

---


## Setup Instructions

### 1. Install Python dependencies (on PC)

```powershell
cd pc_server
pip install websockets pyautogui
```

### 2. Start the WebSocket server

```powershell
python server.py
```

- Make sure your Windows Firewall allows inbound TCP on port 8765.

### 3. Serve the mobile client (on PC)

```powershell
cd mobile_client
python -m http.server 8000
```

- Open your phone's browser to `http://<PC_IP>:8000/` (replace `<PC_IP>` with your PC's LAN IP).

### 4. Helldive

- Go to Helldivers 2 and see strategem inputs fill out.

---

## Usage

- On your phone, tap the arrow keys in the sequence for a strategem.
- The UI will highlight progress and flash for errors/success.
- When a full sequence matches a strategem in your loadout, the PC will simulate the keypresses in Helldivers 2.
- Tap any strategem slot to change it (choose from categorized selector).

---

## References

- [Helldivers 2 Strategem Codes Wiki](https://helldivers.fandom.com/wiki/Strategems)
- [pyautogui documentation](https://pyautogui.readthedocs.io/en/latest/)
- [websockets Python library](https://websockets.readthedocs.io/en/stable/)
- [vgamepad Python library](https://pypi.org/project/vgamepad/)

---

## To Do / Ideas

- [ ] Add support for custom loadouts (save/load)
- [ ] Add timeout for input buffer (auto-clear after inactivity)
- [ ] Add authentication/token for WebSocket security
- [ ] Add option for gamepad/XInput emulation
- [ ] Add visual/audio feedback for successful/failed input
- [ ] Polish mobile UI for more devices
