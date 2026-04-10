import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AudioPlayer } from '../services/audio/AudioPlayer';
import { AudioRecorder } from '../services/audio/AudioRecorder';

class MockAudioBuffer {
  duration: number;
  private channel = new Float32Array(8);

  constructor(length: number, sampleRate: number) {
    this.duration = length / sampleRate;
  }

  getChannelData() {
    return this.channel;
  }
}

describe('audio services', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('stops safely when audio services were never started', () => {
    const recorder = new AudioRecorder();
    const player = new AudioPlayer();

    expect(() => recorder.stop()).not.toThrow();
    expect(() => player.stop()).not.toThrow();
  });

  it('initializes the audio player only once', () => {
    const close = vi.fn();
    const ctorSpy = vi.fn();

    class MockAudioContext {
      currentTime = 3;
      destination = { id: 'dest' };
      close = close;

      constructor() {
        ctorSpy();
      }

      createBuffer() {
        return new MockAudioBuffer(1, 24000);
      }
      createBufferSource() {
        return {
          connect: vi.fn(),
          start: vi.fn(),
        };
      }
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: MockAudioContext,
    });

    const player = new AudioPlayer();
    player.init();
    player.init();

    expect(ctorSpy).toHaveBeenCalledTimes(1);
  });

  it('records audio, encodes it and stops all resources', async () => {
    const trackStop = vi.fn();
    const mediaStream = { getTracks: () => [{ stop: trackStop }] };
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    const processor: {
      connect: ReturnType<typeof vi.fn>;
      disconnect: ReturnType<typeof vi.fn>;
      onaudioprocess: null | ((event: { inputBuffer: { getChannelData: (index: number) => Float32Array } }) => void);
    } = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null,
    };
    const close = vi.fn();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mediaStream),
      },
    });

    class MockAudioContext {
      destination = { id: 'dest' };
      createMediaStreamSource = vi.fn(() => source);
      createScriptProcessor = vi.fn(() => processor);
      close = close;
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: MockAudioContext,
    });

    const onData = vi.fn();
    const recorder = new AudioRecorder();

    await recorder.start(onData);

    processor.onaudioprocess?.({
      inputBuffer: {
        getChannelData: () => Float32Array.from([1, -1, 0.5, 0]),
      },
    });

    expect(onData).toHaveBeenCalledTimes(1);
    expect(typeof onData.mock.calls[0][0]).toBe('string');
    expect(source.connect).toHaveBeenCalledWith(processor);
    expect(processor.connect).toHaveBeenCalledWith(expect.objectContaining({ id: 'dest' }));

    recorder.stop();

    expect(processor.disconnect).toHaveBeenCalledTimes(1);
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(trackStop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('throws a friendly microphone error when recording cannot start', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('blocked')),
      },
    });

    const recorder = new AudioRecorder();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(recorder.start(() => undefined)).rejects.toThrow('Brak dost');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('plays audio chunks, handles scheduling gaps and stops cleanly', () => {
    const start = vi.fn();
    const connect = vi.fn();
    const close = vi.fn();
    let currentTime = 1;

    class MockAudioContext {
      destination = { id: 'dest' };
      get currentTime() {
        return currentTime;
      }
      createBuffer(_channels: number, length: number, sampleRate: number) {
        return new MockAudioBuffer(length, sampleRate);
      }
      createBufferSource() {
        return {
          buffer: null as unknown,
          connect,
          start,
        };
      }
      close = close;
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: MockAudioContext,
    });

    const player = new AudioPlayer();
    const pcm = new Uint8Array([255, 127]);
    const base64 = btoa(String.fromCharCode(...pcm));

    player.playBase64(base64);

    player.init();
    currentTime = 2;
    player.playBase64(base64);
    player.playBase64(base64);
    player.stop();

    expect(connect).toHaveBeenCalledWith(expect.objectContaining({ id: 'dest' }));
    expect(start).toHaveBeenNthCalledWith(1, 2.05);
    expect(start).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('logs playback errors instead of throwing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    class BrokenAudioContext {
      currentTime = 0;
      destination = { id: 'dest' };
      createBuffer() {
        throw new Error('broken buffer');
      }
      createBufferSource() {
        return {
          connect: vi.fn(),
          start: vi.fn(),
        };
      }
      close = vi.fn();
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: BrokenAudioContext,
    });

    const player = new AudioPlayer();
    player.init();
    player.playBase64(btoa(String.fromCharCode(0, 0)));

    expect(errorSpy).toHaveBeenCalled();
  });
});
