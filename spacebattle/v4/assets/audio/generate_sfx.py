#!/usr/bin/env python3
"""
Quantum Defender - 8-Bit SFX Generator
Generates retro chiptune-style sound effects for space defense game
"""

import numpy as np
import wave
import os

SAMPLE_RATE = 44100

def save_wav(filename, audio_data):
    audio_data = np.int16(audio_data * 32767)
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(audio_data.tobytes())
    print(f"Created: {filename}")

def generate_shoot():
    """Laser shot - pew pew"""
    duration = 0.15
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    freq = 800 - 400 * (t / duration)
    wave = np.sin(2 * np.pi * freq * t)
    envelope = np.exp(-t * 10)
    audio = wave * envelope
    return audio / np.max(np.abs(audio))

def generate_explosion():
    """Explosion - boom"""
    duration = 0.3
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    noise = np.random.normal(0, 1, len(t))
    rumble = np.sin(2 * np.pi * 100 * t) * 0.5
    envelope = np.exp(-t * 6)
    audio = (noise * 0.7 + rumble * 0.3) * envelope
    return audio / np.max(np.abs(audio))

def generate_hit():
    """Hit - impact"""
    duration = 0.1
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    wave = np.sin(2 * np.pi * 600 * t)
    envelope = np.exp(-t * 20)
    audio = wave * envelope
    return audio / np.max(np.abs(audio))

def generate_powerup():
    """Powerup - energy boost"""
    duration = 0.4
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    notes = [440, 554, 659, 880]
    audio = np.zeros_like(t)
    for i, freq in enumerate(notes):
        start = i * 0.08
        mask = (t >= start) & (t < start + 0.15)
        audio[mask] += np.sin(2 * np.pi * freq * t[mask]) * np.exp(-(t[mask] - start) * 6)
    return audio / np.max(np.abs(audio))

def generate_shield():
    """Shield activation - energy hum"""
    duration = 0.3
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    freq = 400
    wave = np.sin(2 * np.pi * freq * t)
    mod = np.sin(2 * np.pi * 8 * t)
    audio = wave * (1 + 0.3 * mod) * np.exp(-t * 3)
    return audio / np.max(np.abs(audio))

def generate_ui_click():
    """UI click - blip"""
    duration = 0.05
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    wave = np.sin(2 * np.pi * 1000 * t)
    envelope = np.exp(-t * 30)
    audio = wave * envelope
    return audio / np.max(np.abs(audio))

def generate_warp():
    """Warp/level transition"""
    duration = 0.6
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    freq = 200 * np.exp(t * 3)
    wave = np.sin(2 * np.pi * freq * t)
    envelope = np.exp(-t * 2)
    audio = wave * envelope
    return audio / np.max(np.abs(audio))

def generate_ambient_space():
    """Space ambient loop"""
    duration = 2.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    drone = np.sin(2 * np.pi * 50 * t) * 0.4
    shimmer = np.sin(2 * np.pi * 150 * t + np.sin(2 * np.pi * 0.3 * t) * 20) * 0.2
    audio = drone + shimmer
    return audio / np.max(np.abs(audio))

def main():
    output_dir = "/root/.openclaw/workspace/aocros/projects/quantum-defender/assets/audio"
    os.makedirs(output_dir, exist_ok=True)
    
    print("=" * 60)
    print("QUANTUM DEFENDER - 8-BIT SFX GENERATOR")
    print("=" * 60)
    
    sfx_list = [
        ("shoot.wav", generate_shoot, "Laser shot"),
        ("explosion.wav", generate_explosion, "Explosion"),
        ("hit.wav", generate_hit, "Impact hit"),
        ("powerup.wav", generate_powerup, "Powerup"),
        ("shield.wav", generate_shield, "Shield activation"),
        ("ui_click.wav", generate_ui_click, "UI click"),
        ("warp.wav", generate_warp, "Warp/level transition"),
        ("ambient_space.wav", generate_ambient_space, "Space ambient"),
    ]
    
    print(f"\nGenerating {len(sfx_list)} sound effects...\n")
    
    for filename, generator, description in sfx_list:
        filepath = os.path.join(output_dir, filename)
        audio = generator()
        save_wav(filepath, audio)
        print(f"  {description:20} → {filename}")
    
    print("\n" + "=" * 60)
    print("SFX GENERATION COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
