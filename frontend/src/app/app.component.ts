import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { NavComponent } from './components/nav/nav.component';
import { ThemeService } from './services/theme.service';
import { AppModule } from './app.module';
import { DeviceService } from './services/device.service';

@Component({
  selector: 'app-root',
  imports: [NavComponent, AppModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent{
  title: string = 'les_pates_du_chat';
  toggleState: boolean = false;
  
  constructor(
    private themeService: ThemeService,
    private deviceService: DeviceService
  ) {
    console.log('📱 deviceService.isMobile :', this.deviceService.isMobile);
  }

  ngOnInit() {
    this.themeService.loadTheme().subscribe((theme) => {
      this.themeService.applyTheme(theme.schemes.light);
    });
  }


  // switchToLightTheme() {
  //   console.log('switchToLightTheme');
  //   this.themeService.setTheme('light');
  // }

  // switchToDarkTheme() {
  //   console.log('switchToDarkTheme');
  //   this.themeService.setTheme('dark');
  // }


  // onToggleChange(event: any): void {
  //   this.toggleState = event?.target?.checked ?? false;

  //   console.log('📋 toggleState :', this.toggleState);

  //   if (this.toggleState) {
  //     this.switchToDarkTheme();   // si activé
  //   } else {
  //     this.switchToLightTheme();  // si désactivé
  //   }
  // }
}

