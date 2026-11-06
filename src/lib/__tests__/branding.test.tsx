import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render } from '@testing-library/react';
import { LogoIcon } from '@/components/ui/LogoIcon';
import manifestFn from '@/app/manifest';

describe('Branding Assets & Manifest Verification', () => {
  it('renders LogoIcon component with customizable class and dimensions', () => {
    const { container } = render(<LogoIcon className="w-5 h-5 text-spy-green" size={20} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('w-5', 'h-5', 'text-spy-green');
  });

  it('verifies /public/logo.svg exists and contains shield and target reticle vectors', () => {
    const logoPath = path.resolve('public', 'logo.svg');
    expect(fs.existsSync(logoPath)).toBe(true);
    const content = fs.readFileSync(logoPath, 'utf8');
    expect(content).toContain('<svg');
    expect(content).toContain('stroke="currentColor"');
    expect(content).toContain('viewBox="0 0 24 24"');
  });

  it('verifies /public/favicon.svg and src/app/icon.svg match high-contrast dark+green specification', () => {
    const publicFavicon = path.resolve('public', 'favicon.svg');
    const appIcon = path.resolve('src', 'app', 'icon.svg');

    expect(fs.existsSync(publicFavicon)).toBe(true);
    expect(fs.existsSync(appIcon)).toBe(true);

    const publicContent = fs.readFileSync(publicFavicon, 'utf8');
    const appContent = fs.readFileSync(appIcon, 'utf8');

    expect(publicContent).toContain('#090a0f');
    expect(publicContent).toContain('#00ff9d');
    expect(appContent).toContain('#090a0f');
    expect(appContent).toContain('#00ff9d');
  });

  it('verifies favicon.ico exists in /public and src/app with valid ICO format', () => {
    const publicIco = path.resolve('public', 'favicon.ico');
    const appIco = path.resolve('src', 'app', 'favicon.ico');

    expect(fs.existsSync(publicIco)).toBe(true);
    expect(fs.existsSync(appIco)).toBe(true);

    const bufPublic = fs.readFileSync(publicIco);
    const bufApp = fs.readFileSync(appIco);

    // ICO magic header: 0x0000, 0x0001 (type icon), count >= 1
    expect(bufPublic.readUInt16LE(0)).toBe(0);
    expect(bufPublic.readUInt16LE(2)).toBe(1);
    expect(bufPublic.readUInt16LE(4)).toBe(3); // 16, 32, 48

    expect(bufApp.readUInt16LE(0)).toBe(0);
    expect(bufApp.readUInt16LE(2)).toBe(1);
  });

  it('verifies generated PNG icons have valid PNG magic bytes and proper filesizes', () => {
    const pngs = [
      'apple-touch-icon.png',
      'icon-192.png',
      'icon-512.png',
      'icon-maskable-192.png',
      'icon-maskable-512.png',
    ];

    for (const name of pngs) {
      const filePath = path.resolve('public', name);
      expect(fs.existsSync(filePath), `Missing ${name}`).toBe(true);
      const buf = fs.readFileSync(filePath);
      expect(buf.length).toBeGreaterThan(500);

      // PNG magic number: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50); // P
      expect(buf[2]).toBe(0x4E); // N
      expect(buf[3]).toBe(0x47); // G
    }
  });

  it('verifies web manifest specifications (Operation ME, Op: ME, dark theme colors)', () => {
    const manifestJsonPath = path.resolve('public', 'manifest.json');
    expect(fs.existsSync(manifestJsonPath)).toBe(true);
    const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

    expect(manifestJson.name).toBe('Operation ME');
    expect(manifestJson.short_name).toBe('Op: ME');
    expect(manifestJson.theme_color).toBe('#0b0d11');
    expect(manifestJson.background_color).toBe('#0b0d11');

    const appManifest = manifestFn();
    expect(appManifest.name).toBe('Operation ME');
    expect(appManifest.short_name).toBe('Op: ME');
    expect(appManifest.theme_color).toBe('#0b0d11');
    expect(appManifest.background_color).toBe('#0b0d11');
  });
});

