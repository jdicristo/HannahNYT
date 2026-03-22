import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { GAME_CONFIG } from './game-config';
import { TileState } from './models/tile-state';
import { GameState } from './models/game-state';
import { Row } from './models/row';
import { CurrentGame } from './models/current-game';

@Injectable({ providedIn: 'root' })
export class WordleService {
  private currentGame = CurrentGame.Wordle1;
  currentGame$ = new BehaviorSubject<CurrentGame>(this.currentGame);
  private readonly MAX_GUESSES = 6;
  private readonly WORD_LENGTH = 5;

  private board: Row[] = [];
  private currentRow = 0;
  private currentCol = 0;
  private gameState = GameState.Playing;
  private letterStates: Record<string, TileState> = {};
  private target = GAME_CONFIG.wordle1.targetWord.toUpperCase();

  board$ = new BehaviorSubject<Row[]>([]);
  gameState$ = new BehaviorSubject<GameState>(GameState.Playing);
  letterStates$ = new BehaviorSubject<Record<string, TileState>>({});
  shakeRow$ = new BehaviorSubject<number>(-1);
  bounceRow$ = new BehaviorSubject<number>(-1);
  message$ = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) {
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
    console.log("Handling key:", key);
    console.log("Current game state:", this.gameState);
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
    console.log("Submitting guess for row", this.currentRow);
    if (this.currentCol < this.WORD_LENGTH) {
      this.triggerShake();
      this.showMessage('Not enough letters');
      return;
    }

    const guess = this.board[this.currentRow].tiles.map(t => t.letter).join('');

    this.validateWord(guess).subscribe(isWord => {
      if (!isWord) {
        this.triggerShake();
        this.showMessage('Not in word list');
      }

      const result = this.evaluateGuess(guess);

      result.forEach((state, i) => {
        this.board[this.currentRow].tiles[i].state = state;
      });
      this.board[this.currentRow].submitted = true;
      this.board$.next([...this.board]);

      this.updateLetterStates(guess, result);

      if (guess === this.target) {
        this.gameState = GameState.Won;
        this.triggerBounce();
        setTimeout(() => {
          this.showMessage(this.getWinMessage());
          this.gameState$.next(GameState.Won);
        }, 1800);
      } else if (this.currentRow === this.MAX_GUESSES - 1) {
        this.gameState = GameState.Lost;
        setTimeout(() => {
          this.showMessage(this.target, 5000);
          this.gameState$.next(GameState.Lost);
        }, 1800);
      } else if (this.isPreviousAnswer(guess)) {
        this.showMessage(GAME_CONFIG.wordle2.taunt, 4000);
      }

      this.currentRow++;
      this.currentCol = 0;
    });
  }

  private isPreviousAnswer = (guess: string): boolean =>
    this.currentGame === CurrentGame.Wordle2 &&
    guess === GAME_CONFIG.wordle1.targetWord.toUpperCase();

  validateWord(word: string) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
    return this.http.get(url).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private evaluateGuess(guess: string): TileState[] {
    const result: TileState[] = Array(this.WORD_LENGTH).fill(TileState.Absent);
    const targetArr = this.target.split('');
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
   * Start the 2nd Wordle game
   */
  newGame(): void {
    // advance the game counter each time a new game starts
    // advance the current game enum each time a new game starts
    const max = CurrentGame.Strands;
    if (this.currentGame < max) {
      this.currentGame = (this.currentGame + 1) as CurrentGame;
    }
    this.currentGame$.next(this.currentGame);

    switch(this.currentGame) {
      case CurrentGame.Wordle2:
        this.target = GAME_CONFIG.wordle2.targetWord.toUpperCase();
        break;
      default:
        break;
    }

    this.currentRow = 0;
    this.currentCol = 0;
    this.gameState = GameState.Playing;
    this.letterStates = {};
    this.initBoard();
    this.letterStates$.next({ ...this.letterStates });
    this.gameState$.next(this.gameState);
    this.shakeRow$.next(-1);
    this.bounceRow$.next(-1);
    this.message$.next('');
  }

  private getWinMessage(): string {
    const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
    return messages[Math.min(this.currentRow, messages.length - 1)];
  }
}
