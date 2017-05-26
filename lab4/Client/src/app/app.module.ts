import {NgModule, LOCALE_ID} from '@angular/core';
import {BrowserModule}  from '@angular/platform-browser';
import {FormsModule}    from '@angular/forms';
import {HttpModule}    from '@angular/http';
import {AppRoutingModule} from './app-routing.module';
import {ChartsModule} from 'ng2-charts';
import {DatePipe} from '@angular/common';

import {AppComponent}         from './components/app.component';
import {LoginComponent} from './components/login.component';
import {SidebarComponent} from './components/sidebar.component';
import {DevicesComponent} from './components/devices.component';
import {NavigationComponent} from './components/navigation.component';
import {OverviewComponent} from './components/overview.component';
import {OptionsComponent} from './components/options.component';
import {DeviceService} from './services/device.service';
import {DeviceParserService} from './services/device-parser.service';
import {AccessService} from './services/access.service';
import {DeviceDetailsComponent} from "./components/device-details.component";
import {ContinuousDeviceDetailsComponent} from "./components/continuous-device-details.component";
import {EnumDeviceDetailsComponent} from "./components/enum-device-details.component";
import {BooleanDeviceDetailsComponent} from "./components/boolean-device-details.component";
import {OverlayComponent} from "./components/overlay.component";

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    ChartsModule,
  ],
  declarations: [
    AppComponent,
    SidebarComponent,
    BooleanDeviceDetailsComponent,
    ContinuousDeviceDetailsComponent,
    EnumDeviceDetailsComponent,
    DevicesComponent,
    DeviceDetailsComponent,
    NavigationComponent,
    OverviewComponent,
    OptionsComponent,
    LoginComponent,
    OverlayComponent,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: "de-at" },
    AccessService,
    DatePipe,
    DeviceService,
    DeviceParserService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
