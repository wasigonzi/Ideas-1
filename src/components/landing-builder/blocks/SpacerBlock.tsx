import { BlockShell, Field, NumberField, BgSettings } from "../shared";

export const spacerDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 0,
  padBottom: 0,
  maxWidth: "full",
  height: 80,
};

export function SpacerBlock(props: Record<string, unknown>) {
  return (
    <BlockShell props={{ ...props, padTop: 0, padBottom: 0 }}>
      <div style={{ height: (props.height as number) || 80 }} />
    </BlockShell>
  );
}

export function SpacerSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (u: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Altura">
        <NumberField value={(props.height as number) || 80} onChange={(v) => onChange({ height: v })} unit="px" min={4} max={400} />
      </Field>
      <BgSettings props={props} onChange={onChange} />
    </div>
  );
}
