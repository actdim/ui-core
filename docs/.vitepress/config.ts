import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const GITHUB_REPO = 'https://github.com/actdim/ui-core';

export default withMermaid(
  defineConfig({
    base: '/ui-core/',
    outDir: '../.dist-docs',
    cacheDir: '../node_modules/.cache/vitepress',
    title: 'UI Core',
    description: 'Design system, theme tokens, adaptive layout and core UI foundation for ActDim apps',
    cleanUrls: true,
    lastUpdated: true,
    ignoreDeadLinks: true,

    rewrites: {
      'INDEX.md': 'index.md'
    },

    markdown: {
      config: (md) => {
        const defaultRender =
          md.renderer.rules.link_open ||
          function (tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
          };

        md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
          const token = tokens[idx];
          const hrefIndex = token.attrIndex('href');
          if (hrefIndex >= 0) {
            const href = token.attrs![hrefIndex][1];
            if (href.startsWith('../')) {
              token.attrs![hrefIndex][1] = `${GITHUB_REPO}/blob/main/${href.slice(3)}`;
            }
          }
          return defaultRender(tokens, idx, options, env, self);
        };
      }
    },

    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Theme Tokens', link: '/topic--theme-tokens' },
        { text: 'Adaptive Layout', link: '/topic--adaptive-layout' },
        { text: 'Developer Guide', link: '/topic--developer-guide' },
        { text: 'GitHub', link: GITHUB_REPO }
      ],

      sidebar: [
        {
          text: 'Theme & Tokens',
          items: [
            { text: 'Knowledge Base Index', link: '/' },
            { text: 'Theme Tokens & Design System', link: '/topic--theme-tokens' }
          ]
        },
        {
          text: 'Layout & Overlays',
          items: [
            { text: 'Adaptive Layout', link: '/topic--adaptive-layout' },
            { text: 'Adaptive Overlays', link: '/topic--adaptive-overlays' }
          ]
        },
        {
          text: 'Conventions & Guides',
          items: [
            { text: 'Developer Guide', link: '/topic--developer-guide' },
            { text: 'Frontend Conventions', link: '/topic--frontend-conventions' }
          ]
        }
      ],

      search: {
        provider: 'local'
      },

      socialLinks: [
        { icon: 'github', link: GITHUB_REPO }
      ],

      editLink: {
        pattern: `${GITHUB_REPO}/edit/main/docs/:path`,
        text: 'Edit this page on GitHub'
      },

      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright (c) 2025-2026 Pavel Borodaev'
      }
    },

    mermaid: {
      theme: 'default'
    }
  })
);

