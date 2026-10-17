"use client";

import * as React from "react";
import { IconButton } from "../core/IconButton";
import { Input, type InputProps } from "./Input";

/** Password field: Input with a reveal toggle and a Caps Lock warning. */
export interface PasswordInputProps extends Omit<InputProps, "type" | "end" | "icon" | "mono" | "prefix" | "suffix" | "kbd"> {
  /** Replace the hint with "Caps Lock ativado" while it is on (default true). */
  capsLockHint?: boolean;
  /** Start revealed (docs/showcase only). */
  defaultVisible?: boolean;
}

export function PasswordInput({ capsLockHint = true, defaultVisible = false, hint, onKeyDown, onKeyUp, disabled, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(defaultVisible);
  const [caps, setCaps] = React.useState(false);
  const check = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);
  return (
    <Input
      {...rest}
      disabled={disabled}
      type={visible ? "text" : "password"}
      icon="lock"
      hint={capsLockHint && caps ? "Caps Lock ativado" : hint}
      onKeyDown={(e) => { check(e); onKeyDown?.(e); }}
      onKeyUp={(e) => { check(e); onKeyUp?.(e); }}
      end={
        <IconButton icon={visible ? "eye-off" : "eye"} label={visible ? "Ocultar senha" : "Mostrar senha"} size="sm" tooltip={false} disabled={disabled}
          active={visible} onClick={() => setVisible((v) => !v)} style={{ marginRight: -6 }} />
      }
    />
  );
}
