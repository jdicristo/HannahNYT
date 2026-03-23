import { BehaviorSubject } from 'rxjs';
import { CONFIG } from '../app.config';
import { DictionaryService } from './dictionary.service';
import { Game } from '../models/game';
import { GameState } from '../models/game-state';
import { Injectable } from '@angular/core';
import { Row } from '../models/row';
import { TileState } from '../models/tile-state';

@Injectable({ providedIn: 'root' })
export class WordleService {
  private readonly MAX_GUESSES = 6;
  private readonly WORD_LENGTH = 5;

  private _dictionaryService: DictionaryService;

  private board: Row[] = [];
  private currentRow = 0;
  private currentCol = 0;
  private gameIndex = 0;
  private gameState = GameState.Playing;
  private letterStates: Record<string, TileState> = {};

  private currentGame = CONFIG.games[this.gameIndex];

  board$ = new BehaviorSubject<Row[]>([]);
  currentGame$ = new BehaviorSubject<Game>(this.currentGame);
  gameState$ = new BehaviorSubject<GameState>(GameState.Playing);
  letterStates$ = new BehaviorSubject<Record<string, TileState>>({});
  shakeRow$ = new BehaviorSubject<number>(-1);
  bounceRow$ = new BehaviorSubject<number>(-1);
  message$ = new BehaviorSubject<string>('');
  dictionary: any;

  constructor(private dictionaryService: DictionaryService) {
    this._dictionaryService = dictionaryService;
    this.initBoard();
  }

  private initBoard(): void {
    this.board = Array.from({ length: this.MAX_GUESSES }, () => ({
      tiles: Array.from({ length: this.WORD_LENGTH }, () => ({
        letter: '',
        state: TileState.Empty,
      })),
      submitted: false,
    }));
    this.board$.next(this.board);
  }

  handleKey(key: string): void {
    if (this.gameState !== GameState.Playing) return;
    const k = key.toUpperCase();

    if (k === 'ENTER') {
      this.submitGuess();
    } else if (k === 'BACKSPACE' || key === '←') {
      this.deleteLetter();
    } else if (/^[A-Z]$/.test(k)) {
      this.addLetter(k);
    }
  }

  private addLetter(letter: string): void {
    if (this.currentCol >= this.WORD_LENGTH) return;
    const tile = this.board[this.currentRow].tiles[this.currentCol];
    tile.letter = letter;
    tile.state = TileState.TBD;
    this.currentCol++;
    this.board$.next([...this.board]);
  }

  private deleteLetter(): void {
    if (this.currentCol <= 0) return;
    this.currentCol--;
    const tile = this.board[this.currentRow].tiles[this.currentCol];
    tile.letter = '';
    tile.state = TileState.Empty;
    this.board$.next([...this.board]);
  }

  private submitGuess(): void {
    if (this.currentCol < this.WORD_LENGTH) {
      this.triggerShake();
      this.showMessage('Not enough letters');
      return;
    }

    const guess = this.board[this.currentRow].tiles.map(t => t.letter).join('');

    this._dictionaryService.validateWord(guess).subscribe(isWord => {
      if (!isWord) {
        this.triggerShake();
        this.showMessage('Not in word list');
        return;
      }

      const result = this.evaluateGuess(guess);
      const target = this.currentGame.targetWord.toUpperCase();

      result.forEach((state, i) => {
        this.board[this.currentRow].tiles[i].state = state;
      });
      this.board[this.currentRow].submitted = true;
      this.board$.next([...this.board]);

      this.updateLetterStates(guess, result);

      if (guess === target) {
        this.gameState = GameState.Won;
        this.triggerBounce();
        setTimeout(() => {
          this.showMessage(this.getWinMessage());
          this.gameState$.next(GameState.Won);
        }, 1800);
      } else if (this.currentRow === this.MAX_GUESSES - 1) {
        this.gameState = GameState.Lost;
        setTimeout(() => {
          this.showMessage(target, 5000);
          this.gameState$.next(GameState.Lost);
        }, 1800);
      } else if (this.shouldTaunt(guess) && this.currentGame.taunt) {
        this.showMessage(this.currentGame.taunt, 5000);
      }

      this.currentRow++;
      this.currentCol = 0;
    });
  }

  private shouldTaunt = (guess: string): boolean =>
    this.gameIndex > 0 &&
    guess === CONFIG.games[this.gameIndex - 1].targetWord.toUpperCase();

  private evaluateGuess(guess: string): TileState[] {
    const result: TileState[] = Array(this.WORD_LENGTH).fill(TileState.Absent);
    const targetArr = this.currentGame.targetWord.toUpperCase().split('');
    const guessArr = guess.split('');
    const targetCount: Record<string, number> = {};

    // First pass: correct
    guessArr.forEach((letter, i) => {
      if (letter === targetArr[i]) {
        result[i] = TileState.Correct;
        targetArr[i] = '#';
      } else {
        targetCount[targetArr[i]] = (targetCount[targetArr[i]] || 0) + 1;
      }
    });

    // Second pass: present
    guessArr.forEach((letter, i) => {
      if (result[i] !== TileState.Correct && targetCount[letter] > 0) {
        result[i] = TileState.Present;
        targetCount[letter]--;
      }
    });

    return result;
  }

  private updateLetterStates(guess: string, result: TileState[]): void {
    guess.split('').forEach((letter, i) => {
      const existing = this.letterStates[letter];
      const priority: Record<TileState, number> = {
        [TileState.Correct]: 3,
        [TileState.Present]: 2,
        [TileState.Absent]: 1,
        [TileState.TBD]: 0,
        [TileState.Empty]: 0,
      };
      if (!existing || priority[result[i]] > priority[existing]) {
        this.letterStates[letter] = result[i];
      }
    });
    this.letterStates$.next({ ...this.letterStates });
  }

  private triggerShake(): void {
    this.shakeRow$.next(this.currentRow);
    setTimeout(() => this.shakeRow$.next(-1), 600);
  }

  private triggerBounce(): void {
    this.bounceRow$.next(this.currentRow);
    setTimeout(() => this.bounceRow$.next(-1), 1800);
  }

  private showMessage(msg: string, duration = 2000): void {
    this.message$.next(msg);
    setTimeout(() => this.message$.next(''), duration);
  }

  /**
   * Start the next Wordle game
   */
  newGame(): void {
    // advance the game counter each time a new game starts
    // advance the current game each time a new game starts
    const max = CONFIG.games.length - 1;
    if (this.gameIndex < max) {
      this.gameIndex++;
      this.currentGame = CONFIG.games[this.gameIndex];
      this.currentRow = 0;
      this.currentCol = 0;
      this.gameState = GameState.Playing;
      this.letterStates = {};
      this.initBoard();
      this.letterStates$.next({ ...this.letterStates });
      this.gameState$.next(this.gameState);
      this.currentGame$.next(this.currentGame);
      this.shakeRow$.next(-1);
      this.bounceRow$.next(-1);
      this.message$.next('');
    }
  }

  private getWinMessage(): string {
    const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
    return messages[Math.min(this.currentRow, messages.length - 1)];
  }
}
