import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2
  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  setTheme(theme: string) {
    const themes = ['dark', 'light', 'dark-hc', 'light-hc', 'dark-mc', 'light-mc'];
    themes.forEach((t) => this.renderer.removeClass(document.body, t));
    this.renderer.addClass(document.body, theme);
  }
}
