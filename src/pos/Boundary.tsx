/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The net under the whole till.
 *
 * React unmounts the entire tree when a render throws, which is how this app
 * used to go white — a shop staring at a blank screen with no idea whether
 * its day was still in there. A boundary turns that into a card with a code
 * on it and a way back.
 *
 * It has to be a class: there is still no hook for this.
 */

import { Component, type ReactNode } from "react";
import { reportError } from "./reportIssue";
import { IssueBody } from "./ErrorCard";

interface State {
  crashed: boolean;
  details: string;
}

export class Boundary extends Component<{ children: ReactNode }, State> {
  state: State = { crashed: false, details: "" };

  static getDerivedStateFromError(cause: unknown): State {
    return {
      crashed: true,
      details: cause instanceof Error ? cause.message : String(cause),
    };
  }

  componentDidCatch(cause: unknown) {
    reportError(
      "SW-01",
      `render: ${cause instanceof Error ? cause.message : String(cause)}`,
      /* The card is already on screen below — this is only for the log. */
      { quiet: true },
    );
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#05060a] px-5 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#5d3346] bg-[#0b1120] p-5">
          <IssueBody
            code="SW-01"
            details={this.state.details}
            onClose={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }
}
