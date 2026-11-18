/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Предохранитель: ошибка одного инструмента не гасит весь интерфейс.
import { Component, type ReactNode } from "react";
import { errorText } from "../lib/errors";

type State = { error: unknown };

export default class ToolBoundary extends Component<{ name: string; children: ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: unknown): State { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="card tool-crash" role="alert">
      <b>«{this.props.name}» не смог открыться</b>
      <span className="muted">{errorText(this.state.error)}</span>
      <button type="button" className="btn" onClick={() => this.setState({ error: null })}>Попробовать снова</button>
    </div>;
  }
}
