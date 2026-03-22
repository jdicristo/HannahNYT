import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { WordleService } from './wordle.service';
import { GameState } from './models/game-state';
import { CurrentGame } from './models/current-game';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  message = '';
  gameState: GameState = GameState.Playing;
  // expose enum to template
  GameState = GameState;
  CurrentGame = CurrentGame;
  currentGame: CurrentGame = CurrentGame.Wordle1;
  private subs = new Subscription();

  constructor(private wordle: WordleService) {}

  ngOnInit(): void {
    this.subs.add(this.wordle.message$.subscribe(m => (this.message = m)));
    this.subs.add(this.wordle.gameState$.subscribe(s => (this.gameState = s)));
    this.subs.add(this.wordle.currentGame$.subscribe(n => (this.currentGame = n)));
  }

  nextGame(): void {
    this.wordle.newGame();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    this.wordle.handleKey(event.key.toUpperCase() === 'BACKSPACE' ? 'BACKSPACE' : event.key);
  }
}
