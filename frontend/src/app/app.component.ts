import { Component } from '@angular/core';
import { NavComponent } from './components/nav/nav.component';
import { ThemeService } from './services/theme.service';
import { MATERIAL_IMPORTS } from './app-material';
// import { DeviceService } from './services/device.service';

@Component({
  selector: 'app-root',
  imports: [NavComponent, MATERIAL_IMPORTS],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent{
  title: string = 'les_pates_du_chat';
  
  constructor(
    private themeService: ThemeService,
    // private deviceService: DeviceService
  ) {
    // console.log('📱 deviceService.isMobile :', this.deviceService.isMobile);
  }

  ngOnInit() {
    this.themeService.initializeTheme();
  }
}

