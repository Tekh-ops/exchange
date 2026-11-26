import { extend } from '@pixi/react';
import { Container, Graphics, Sprite, Text, TextureStyle } from 'pixi.js';
import { initPixelTextures } from '../entities/pixelTextures';

let isPixiExtended = false;

export function setupPixiEngine(): void {
  if (isPixiExtended) return;

  // Set default texture scaling to nearest for sharp pixel art
  TextureStyle.defaultOptions.scaleMode = 'nearest';

  extend({
    Container,
    Graphics,
    Sprite,
    Text,
  });

  // Initialize procedural pixel-art textures
  initPixelTextures();

  isPixiExtended = true;
}
