"use client";

import React from "react";
import type { LandingBlock } from "./types";
import { BLOCK_REGISTRY } from "./registry";

interface LandingRendererProps {
  blocks: LandingBlock[];
  services?: unknown[];
  projects?: unknown[];
  employees?: unknown[];
}

function injectData(
  props: Record<string, unknown>,
  type: string,
  services: unknown[],
  projects: unknown[],
  employees: unknown[]
): Record<string, unknown> {
  if (type === "ServicesBlock") return { ...props, services };
  if (type === "ProjectsBlock") return { ...props, projects };
  if (type === "TeamBlock") return { ...props, employees };
  return props;
}

export function LandingRenderer({ blocks, services = [], projects = [], employees = [] }: LandingRendererProps) {
  return (
    <>
      {blocks.map((block) => {
        const meta = BLOCK_REGISTRY[block.type];
        if (!meta) return null;

        const Comp = meta.component;
        const desktopProps = injectData(
          { ...meta.defaultProps, ...block.props },
          block.type, services, projects, employees
        );

        const hasTablet = block.propsTablet && Object.keys(block.propsTablet).length > 0;
        const hasMobile = block.propsMobile && Object.keys(block.propsMobile).length > 0;

        // No responsive overrides → single render (no DOM bloat)
        if (!hasTablet && !hasMobile) {
          return <Comp key={block.id} {...desktopProps} />;
        }

        const tabletProps = hasTablet
          ? injectData({ ...meta.defaultProps, ...block.props, ...block.propsTablet }, block.type, services, projects, employees)
          : desktopProps;
        const mobileProps = hasMobile
          ? injectData({ ...meta.defaultProps, ...block.props, ...block.propsMobile }, block.type, services, projects, employees)
          : desktopProps;

        // Render 3 versions shown/hidden via CSS breakpoints
        return (
          <React.Fragment key={block.id}>
            <div className="hidden lg:block"><Comp {...desktopProps} /></div>
            <div className="hidden md:block lg:hidden"><Comp {...tabletProps} /></div>
            <div className="block md:hidden"><Comp {...mobileProps} /></div>
          </React.Fragment>
        );
      })}
    </>
  );
}
