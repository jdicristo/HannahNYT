import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { WordleService } from '../wordle.service';
import { TileState } from '..';

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss'],
})
export class KeyboardComponent implements OnInit, OnDestroy {
  rows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','←'],
  ];

  letterStates: Record<string, TileState> = {};
  private subs = new Subscription();

  constructor(private wordle: WordleService) {}

  ngOnInit(): void {
    this.subs.add(this.wordle.letterStates$.subscribe(s => (this.letterStates = s)));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  press(key: string): void {
    this.wordle.handleKey(key === '←' ? 'BACKSPACE' : key);
  }

  stateOf(key: string): TileState {
    return this.letterStates[key] || TileState.Empty;
  }
}
