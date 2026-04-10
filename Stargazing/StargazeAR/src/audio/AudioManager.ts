import { Audio } from 'expo-av';

const TARGET_CHIME_ASSET = require('../../assets/sounds/tap-chime.wav');

class AudioManager {
  private chimeSound: Audio.Sound | null = null;
  private isConfigured = false;
  private loadingPromise: Promise<void> | null = null;

  private async configure() {
    if (this.isConfigured) {
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });

    this.isConfigured = true;
  }

  public async ensureLoaded() {
    if (this.chimeSound) {
      return;
    }

    if (this.loadingPromise) {
      await this.loadingPromise;
      return;
    }

    this.loadingPromise = (async () => {
      await this.configure();

      const { sound } = await Audio.Sound.createAsync(
        TARGET_CHIME_ASSET,
        {
          shouldPlay: false,
          volume: 0.28,
          progressUpdateIntervalMillis: 250,
        },
      );

      this.chimeSound = sound;
    })();

    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }

  public async playTargetChime(playbackRate: number) {
    await this.ensureLoaded();

    if (!this.chimeSound) {
      return;
    }

    const rate = Math.min(1.25, Math.max(0.88, playbackRate));

    try {
      await this.chimeSound.stopAsync();
    } catch {
      // Sound may not be playing yet.
    }

    await this.chimeSound.setPositionAsync(0);
    await this.chimeSound.setRateAsync(rate, true);
    await this.chimeSound.playAsync();
  }

  public async unload() {
    if (!this.chimeSound) {
      return;
    }

    await this.chimeSound.unloadAsync();
    this.chimeSound = null;
  }
}

export const audioManager = new AudioManager();
