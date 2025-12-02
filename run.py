#!/usr/bin/env python3
"""
Storyboard Generator - Server Manager
Starts and stops both backend (Node.js) and frontend (Python HTTP server)

Usage:
    python run.py start    - Start both servers
    python run.py stop     - Stop both servers
    python run.py restart  - Restart both servers
    python run.py status   - Check if servers are running
    python run.py logs     - View backend logs (tail -f)
    python run.py dev      - Start backend in foreground (shows logs directly)
"""

import subprocess
import sys
import os
import signal
import time
import socket
import webbrowser
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.absolute()
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
PID_FILE = PROJECT_ROOT / ".server_pids"
LOG_FILE = PROJECT_ROOT / "backend.log"

BACKEND_PORT = 3001
FRONTEND_PORT = 8080


def is_port_in_use(port):
    """Check if a port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0


def get_running_pids():
    """Read PIDs from the PID file"""
    if not PID_FILE.exists():
        return {}
    
    pids = {}
    try:
        with open(PID_FILE, 'r') as f:
            for line in f:
                line = line.strip()
                if '=' in line:
                    name, pid = line.split('=')
                    pids[name] = int(pid)
    except Exception as e:
        print(f"Warning: Could not read PID file: {e}")
    return pids


def save_pids(pids):
    """Save PIDs to the PID file"""
    with open(PID_FILE, 'w') as f:
        for name, pid in pids.items():
            f.write(f"{name}={pid}\n")


def is_process_running(pid):
    """Check if a process with given PID is running"""
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def start_backend():
    """Start the Node.js backend server"""
    print("🚀 Starting backend server...")
    
    if is_port_in_use(BACKEND_PORT):
        print(f"⚠️  Port {BACKEND_PORT} is already in use. Backend may already be running.")
        return None
    
    # Check if node_modules exists
    if not (BACKEND_DIR / "node_modules").exists():
        print("📦 Installing backend dependencies...")
        subprocess.run(["npm", "install"], cwd=BACKEND_DIR, check=True)
    
    # Open log file for writing
    log_file = open(LOG_FILE, 'w')
    
    # Start the backend with logs going to file
    process = subprocess.Popen(
        ["node", "server.js"],
        cwd=BACKEND_DIR,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        preexec_fn=os.setpgrp  # Create new process group
    )
    
    # Wait a bit and check if it started
    time.sleep(2)
    if process.poll() is not None:
        print("❌ Backend failed to start!")
        log_file.close()
        # Read and print the log
        with open(LOG_FILE, 'r') as f:
            print(f.read())
        return None
    
    print(f"✅ Backend started on http://localhost:{BACKEND_PORT} (PID: {process.pid})")
    print(f"📄 Logs: {LOG_FILE}")
    print(f"   View logs: python run.py logs")
    return process.pid


def start_frontend():
    """Start a simple HTTP server for the frontend"""
    print("🌐 Starting frontend server...")
    
    if is_port_in_use(FRONTEND_PORT):
        print(f"⚠️  Port {FRONTEND_PORT} is already in use. Frontend may already be running.")
        return None
    
    # Start Python HTTP server
    process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(FRONTEND_PORT)],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        preexec_fn=os.setpgrp  # Create new process group
    )
    
    # Wait a bit and check if it started
    time.sleep(1)
    if process.poll() is not None:
        print("❌ Frontend server failed to start!")
        return None
    
    print(f"✅ Frontend started on http://localhost:{FRONTEND_PORT} (PID: {process.pid})")
    return process.pid


def stop_process(name, pid):
    """Stop a process by PID"""
    if not is_process_running(pid):
        print(f"ℹ️  {name} (PID: {pid}) is not running")
        return True
    
    try:
        # Try to kill the process group
        os.killpg(os.getpgid(pid), signal.SIGTERM)
        time.sleep(1)
        
        # Force kill if still running
        if is_process_running(pid):
            os.killpg(os.getpgid(pid), signal.SIGKILL)
            time.sleep(0.5)
        
        print(f"✅ Stopped {name} (PID: {pid})")
        return True
    except ProcessLookupError:
        print(f"ℹ️  {name} (PID: {pid}) was already stopped")
        return True
    except Exception as e:
        print(f"❌ Failed to stop {name}: {e}")
        return False


def cmd_start():
    """Start both servers"""
    print("\n" + "="*50)
    print("🎬 Starting Storyboard Generator")
    print("="*50 + "\n")
    
    pids = {}
    
    # Start backend
    backend_pid = start_backend()
    if backend_pid:
        pids['backend'] = backend_pid
    
    print()
    
    # Start frontend
    frontend_pid = start_frontend()
    if frontend_pid:
        pids['frontend'] = frontend_pid
    
    # Save PIDs
    if pids:
        save_pids(pids)
    
    print("\n" + "="*50)
    if 'backend' in pids and 'frontend' in pids:
        print("✅ All servers started successfully!")
        print(f"\n📍 Open your browser to: http://localhost:{FRONTEND_PORT}")
        print(f"📍 Backend API: http://localhost:{BACKEND_PORT}")
        print("\n💡 To stop the servers, run: python run.py stop")
        
        # Ask if user wants to open browser
        try:
            response = input("\n🌐 Open browser now? [Y/n]: ").strip().lower()
            if response != 'n':
                webbrowser.open(f"http://localhost:{FRONTEND_PORT}")
        except (EOFError, KeyboardInterrupt):
            pass
    else:
        print("⚠️  Some servers failed to start. Check the output above.")
    print("="*50 + "\n")


def cmd_stop():
    """Stop both servers"""
    print("\n" + "="*50)
    print("🛑 Stopping Storyboard Generator")
    print("="*50 + "\n")
    
    pids = get_running_pids()
    
    if not pids:
        print("ℹ️  No servers are tracked. They may not be running.")
        # Try to find and kill by port
        print("🔍 Checking ports...")
        
        if is_port_in_use(BACKEND_PORT):
            print(f"⚠️  Port {BACKEND_PORT} is in use. Try: lsof -ti:{BACKEND_PORT} | xargs kill")
        else:
            print(f"✅ Port {BACKEND_PORT} is free")
            
        if is_port_in_use(FRONTEND_PORT):
            print(f"⚠️  Port {FRONTEND_PORT} is in use. Try: lsof -ti:{FRONTEND_PORT} | xargs kill")
        else:
            print(f"✅ Port {FRONTEND_PORT} is free")
    else:
        for name, pid in pids.items():
            stop_process(name.capitalize(), pid)
        
        # Remove PID file
        if PID_FILE.exists():
            PID_FILE.unlink()
    
    print("\n" + "="*50)
    print("✅ Shutdown complete")
    print("="*50 + "\n")


def cmd_restart():
    """Restart both servers"""
    cmd_stop()
    time.sleep(1)
    cmd_start()


def cmd_status():
    """Check status of servers"""
    print("\n" + "="*50)
    print("📊 Server Status")
    print("="*50 + "\n")
    
    pids = get_running_pids()
    
    # Check backend
    backend_status = "🔴 Stopped"
    if 'backend' in pids and is_process_running(pids['backend']):
        backend_status = f"🟢 Running (PID: {pids['backend']})"
    elif is_port_in_use(BACKEND_PORT):
        backend_status = "🟡 Port in use (unknown process)"
    
    print(f"Backend  (port {BACKEND_PORT}): {backend_status}")
    
    # Check frontend
    frontend_status = "🔴 Stopped"
    if 'frontend' in pids and is_process_running(pids['frontend']):
        frontend_status = f"🟢 Running (PID: {pids['frontend']})"
    elif is_port_in_use(FRONTEND_PORT):
        frontend_status = "🟡 Port in use (unknown process)"
    
    print(f"Frontend (port {FRONTEND_PORT}): {frontend_status}")
    
    if LOG_FILE.exists():
        print(f"\n📄 Log file: {LOG_FILE}")
        print("   View logs: python run.py logs")
    
    print("\n" + "="*50 + "\n")


def cmd_logs():
    """View backend logs (tail -f style)"""
    if not LOG_FILE.exists():
        print("❌ No log file found. Start the backend first with: python run.py start")
        return
    
    print(f"📄 Showing logs from {LOG_FILE}")
    print("   Press Ctrl+C to stop\n")
    print("="*60)
    
    try:
        # Use tail -f to follow the log file
        subprocess.run(["tail", "-f", str(LOG_FILE)])
    except KeyboardInterrupt:
        print("\n\n✅ Stopped watching logs")


def cmd_dev():
    """Start backend in foreground mode (shows logs directly in terminal)"""
    print("\n" + "="*50)
    print("🎬 Starting Storyboard Generator (Dev Mode)")
    print("="*50 + "\n")
    
    # Start frontend in background first
    frontend_pid = start_frontend()
    pids = {}
    if frontend_pid:
        pids['frontend'] = frontend_pid
        save_pids(pids)
    
    print()
    
    if is_port_in_use(BACKEND_PORT):
        print(f"⚠️  Port {BACKEND_PORT} is already in use. Backend may already be running.")
        return
    
    # Check if node_modules exists
    if not (BACKEND_DIR / "node_modules").exists():
        print("📦 Installing backend dependencies...")
        subprocess.run(["npm", "install"], cwd=BACKEND_DIR, check=True)
    
    print("🚀 Starting backend server in foreground...")
    print(f"   Frontend: http://localhost:{FRONTEND_PORT}")
    print(f"   Backend:  http://localhost:{BACKEND_PORT}")
    print("\n   Press Ctrl+C to stop\n")
    print("="*60 + "\n")
    
    try:
        # Run backend in foreground - logs will show directly
        subprocess.run(["node", "server.js"], cwd=BACKEND_DIR)
    except KeyboardInterrupt:
        print("\n\n🛑 Backend stopped")
        # Stop frontend too
        if frontend_pid and is_process_running(frontend_pid):
            stop_process("Frontend", frontend_pid)
        if PID_FILE.exists():
            PID_FILE.unlink()


def print_usage():
    """Print usage information"""
    print(__doc__)


def main():
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "start":
        cmd_start()
    elif command == "stop":
        cmd_stop()
    elif command == "restart":
        cmd_restart()
    elif command == "status":
        cmd_status()
    elif command == "logs":
        cmd_logs()
    elif command == "dev":
        cmd_dev()
    elif command in ["-h", "--help", "help"]:
        print_usage()
    else:
        print(f"Unknown command: {command}")
        print_usage()
        sys.exit(1)


if __name__ == "__main__":
    main()

