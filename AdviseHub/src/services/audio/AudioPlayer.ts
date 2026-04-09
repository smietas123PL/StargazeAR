/**
 * AudioPlayer - Odpowiada za odtwarzanie strumienia audio otrzymanego od AI.
 * Architektura:
 * - Odbiera fragmenty audio w formacie base64 (PCM 16-bit, 24kHz).
 * - Dekoduje base64 do surowych bajtów, a następnie do Float32Array.
 * - Używa AudioBufferSourceNode do odtwarzania zdekodowanych fragmentów.
 * - Implementuje mechanizm buforowania i planowania czasu (nextPlayTime) w celu zapewnienia płynnego odtwarzania bez przerw (gapless playback).
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextPlayTime: number = 0;

  init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.nextPlayTime = this.audioContext.currentTime;
    }
  }

  playBase64(base64: string) {
    if (!this.audioContext) return;
    
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const dataView = new DataView(bytes.buffer);
      const float32 = new Float32Array(bytes.length / 2);
      for (let i = 0; i < float32.length; i++) {
        float32[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }

      const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      // Ensure gapless playback by scheduling slightly in the future if needed
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + 0.05;
      }
      
      source.start(this.nextPlayTime);
      this.nextPlayTime += buffer.duration;
    } catch (error) {
      console.error("Error playing audio chunk:", error);
    }
  }

  stop() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.nextPlayTime = 0;
  }
}
