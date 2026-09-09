#!/usr/bin/env python3
"""
Quantum Defender - Missing SFX Generator
Generates additional retro chiptune-style sound effects
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

def generate_enemy_spawn():
    """Enemy spawn - warning tone"""
    duration = 0.3
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    freq = 300 + 200 * (t / duration)
    wave = np.sin(2 * np.pi * freq * t)
    envelope = np.exp(-t * 5)
    audio = wave * envelope
    return audio / np.max(np.abs(audio))

def generate_boss_alarm():
    """Boss alarm - urgent alert"""
    duration = 0.5
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    # Create alternating square wave pattern
    freq = np.where((t * 4).astype(int) % 2 == 0, 800, 600)
    wave = np.sin(2 * np.pi * freq * t)
    envelope = np.ones_like(t) * 0.8
    audio = wave * envelope
    return audio / np.max(np.abs(audio))

def generate_level_complete():
    """Level complete - victory fanfare"""
    duration = 0.8
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    notes = [523, 659, 783, 1046, 1318]
    audio = np.zeros_like(t)
    for i, freq in enumerate(notes):
        start = i * 0.12
        mask = (t >= start) & (t < start + 0.2)
        audio[mask] += np.sin(2 * np.pi * freq * t[mask]) * np.exp(-(t[mask] - start) * 3)
    return audio / np.max(np.abs(audio))

def generate_game_over():
    """Game over - descending tones"""
    duration = 0.6
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    notes = [523, 466, 415, 349]
    audio = np.zeros_like(t)
    for i, freq in enumerate(notes):
        start = i * 0.12
        mask = (t >= start) & (t < start + 0.15)
        audio[mask] += np.sin(2 * np.pi * freq * t[mask]) * 0.5
    return audio / np.max(np.abs(audio))

def generate_enemy_shoot():
    """Enemy shoot - lower pitch"""
    duration = 0.15
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    freq = 400 - 200 * (t / duration)
    wave = np.sin(2 * np.pi * freq * t)
    envelope = np.exp(-t * 10)
    audio = wave * envelope
    return audio / np.max(np.abs(audio))

def main():
    output_dir = "/root/.openclaw/workspace/aocros/projects/quantum-defender/assets/audio"
    os.makedirs(output_dir, exist_ok=True)
    
    print("=" * 60)
    print("QUANTUM DEFENDER - MISSING SFX GENERATOR")
    print("=" * 60)
    
    sfx_list = [
        ("enemy_spawn.wav", generate_enemy_spawn, "Enemy spawn"),
        ("boss_alarm.wav", generate_boss_alarm, "Boss alarm"),
        ("level_complete.wav", generate_level_complete, "Level complete"),
        ("game_over.wav", generate_game_over, "Game over"),
        ("enemy_shoot.wav", generate_enemy_shoot, "Enemy shoot"),
    ]
    
    print(f"\nGenerating {len(sfx_list)} missing sound effects...\n")
    
    for filename, generator, description in sfx_list:
        filepath = os.path.join(output_dir, filename)
        audio = generator()
        save_wav(filepath, audio)
        print(f"  {description:20} → {filename}")
    
    print("\n" + "=" * 60)
    print("MISSING SFX GENERATION COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
