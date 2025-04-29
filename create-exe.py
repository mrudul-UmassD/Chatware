#!/usr/bin/env python3
"""
Create executable for the Chatware installer
This script builds a standalone executable for the Chatware installer script.
"""

import os
import sys
import subprocess
import platform

def check_pyinstaller():
    """Check if PyInstaller is installed"""
    try:
        subprocess.run(
            ["pyinstaller", "--version"],
            capture_output=True,
            text=True,
            check=False
        )
        return True
    except FileNotFoundError:
        return False

def install_pyinstaller():
    """Install PyInstaller using pip"""
    print("Installing PyInstaller...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "pyinstaller"],
        check=True
    )

def build_exe():
    """Build the executable using PyInstaller"""
    print("Building ChatwareInstaller executable...")
    
    # Determine icon file based on platform
    icon_file = "chatware_icon.ico" if platform.system() == "Windows" else "chatware_icon.icns"
    
    # Create clean build folder
    if not os.path.exists("build_installer"):
        os.mkdir("build_installer")
    
    # PyInstaller command
    cmd = [
        "pyinstaller",
        "--onefile",
        "--name", "ChatwareInstaller",
        "--clean",
        "--distpath", "./build_installer",
        "--workpath", "./build_installer/temp",
        "--specpath", "./build_installer",
        "install-chatware.py"
    ]
    
    # Add icon if it exists
    if os.path.exists(icon_file):
        cmd.extend(["--icon", icon_file])
    
    # Run PyInstaller
    subprocess.run(cmd, check=True)
    
    # Cleanup PyInstaller artifacts
    for cleanup_item in ["build_installer/temp", "build_installer/ChatwareInstaller.spec"]:
        if os.path.exists(cleanup_item):
            if os.path.isdir(cleanup_item):
                import shutil
                shutil.rmtree(cleanup_item)
            else:
                os.remove(cleanup_item)

def main():
    """Main function"""
    print("=" * 60)
    print("  Building Chatware Installer Executable")
    print("=" * 60)
    
    # Check if PyInstaller is installed
    if not check_pyinstaller():
        print("PyInstaller is not installed. Installing it now...")
        try:
            install_pyinstaller()
        except Exception as e:
            print(f"Error installing PyInstaller: {e}")
            print("Please run: pip install pyinstaller")
            sys.exit(1)
    
    # Build the executable
    try:
        build_exe()
        
        # Determine the output path based on platform
        exe_extension = ".exe" if platform.system() == "Windows" else ""
        output_path = os.path.abspath(f"./build_installer/ChatwareInstaller{exe_extension}")
        
        print("\nBuild successful!")
        print(f"Executable created at: {output_path}")
        print("\nYou can now distribute this file to install and run Chatware.")
        
    except Exception as e:
        print(f"Error building executable: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 