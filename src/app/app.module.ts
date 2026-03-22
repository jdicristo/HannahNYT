import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { BoardComponent } from './board/board.component';
import { KeyboardComponent } from './keyboard/keyboard.component';

@NgModule({
  declarations: [AppComponent, BoardComponent, KeyboardComponent],
  imports: [BrowserModule, HttpClientModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
