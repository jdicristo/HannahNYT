import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Game } from './models/game';
import { GameState } from './models/game-state';
import { GAME_CONFIG } from './game-config';
import { Subscription } from 'rxjs';
import { WordleService } from './wordle.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  message = '';
  gameState: GameState = GameState.Playing;
  currentGame: Game = GAME_CONFIG.games[0];

  // expose enum to template
  GameState = GameState;
  modalClosed = false;
  private subs = new Subscription();
  constructor(private wordle: WordleService) {}

  ngOnInit(): void {
    this.subs.add(this.wordle.message$.subscribe(m => (this.message = m)));
    this.subs.add(this.wordle.gameState$.subscribe(s => (this.gameState = s)));
    this.subs.add(this.wordle.currentGame$.subscribe(g => (this.currentGame = g)));
    // when game state changes away from Won, reset modalClosed so keyboard returns
    this.subs.add(this.wordle.gameState$.subscribe(s => {
      if (s !== GameState.Won) this.modalClosed = false;
    }));
  }

  nextGame(): void {
    // ensure modal flag reset and start next game
    this.modalClosed = false;
    this.wordle.newGame();
  }

  closeModal(): void {
    this.modalClosed = true;
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
