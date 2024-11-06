import { Component } from '@angular/core';
import { NavComponent } from './components/nav/nav.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private themeService: ThemeService) {}

  switchToLightTheme() {
    this.themeService.setTheme('light');
  }

  switchToDarkTheme() {
    this.themeService.setTheme('dark');
  }
}

