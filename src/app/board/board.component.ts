import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { WordleService } from '../services/wordle.service';
import { Row } from '..';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit, OnDestroy {
  board: Row[] = [];
  shakeRow = -1;
  bounceRow = -1;
  private subs = new Subscription();

  constructor(private wordle: WordleService) {}

  ngOnInit(): void {
    this.subs.add(this.wordle.board$.subscribe(b => (this.board = b)));
    this.subs.add(this.wordle.shakeRow$.subscribe(r => (this.shakeRow = r)));
    this.subs.add(this.wordle.bounceRow$.subscribe(r => (this.bounceRow = r)));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  tileDelay(col: number): string {
    return `${col * 0.1}s`;
  }

  bounceDelay(col: number): string {
    return `${col * 0.1}s`;
  }
}
