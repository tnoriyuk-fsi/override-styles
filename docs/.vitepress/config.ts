import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

// GitHub Pages では https://tnoriyuk-fsi.github.io/override-styles/ で公開されるため
// base にリポジトリ名を指定する。
export default withMermaid(
  defineConfig({
    lang: 'ja',
    title: 'Override Styles',
    description:
      'ホストごとに任意の CSS を上書きする Google Chrome 拡張機能（Manifest V3）の設計ドキュメント',
    base: '/override-styles/',
    lastUpdated: true,
    cleanUrls: true,
    // adr/README.md を adr/index.html として出力する。
    // GitHub ではフォルダの README として表示され、サイトでは /adr/ で開ける。
    rewrites: {
      'adr/README.md': 'adr/index.md',
    },
    head: [['link', { rel: 'icon', href: '/override-styles/favicon.ico' }]],
    themeConfig: {
      nav: [
        { text: 'ホーム', link: '/' },
        { text: 'アーキテクチャ', link: '/architecture' },
        { text: '開発ガイド', link: '/development' },
        {
          text: 'GitHub',
          link: 'https://github.com/tnoriyuk-fsi/override-styles',
        },
      ],
      sidebar: [
        {
          text: '概要',
          items: [{ text: 'はじめに', link: '/' }],
        },
        {
          text: '設計・仕様',
          collapsed: false,
          items: [
            { text: 'アーキテクチャ', link: '/architecture' },
            { text: 'データモデル', link: '/data-model' },
            { text: 'ADR（設計判断記録）', link: '/adr/' },
          ],
        },
        {
          text: '開発',
          collapsed: false,
          items: [
            { text: '開発ガイド', link: '/development' },
            { text: 'テスト方針', link: '/testing' },
            { text: 'セキュリティ', link: '/security' },
            { text: 'リリース手順', link: '/release' },
          ],
        },
        {
          text: '利用者向け・運用',
          collapsed: false,
          items: [
            { text: 'ユーザーガイド', link: '/user-guide' },
            { text: 'プライバシー', link: '/privacy' },
            { text: 'ロードマップ', link: '/roadmap' },
            { text: 'FAQ', link: '/faq' },
          ],
        },
      ],
      socialLinks: [
        {
          icon: 'github',
          link: 'https://github.com/tnoriyuk-fsi/override-styles',
        },
      ],
      search: { provider: 'local' },
      outline: { label: '目次', level: [2, 3] },
      docFooter: { prev: '前のページ', next: '次のページ' },
      lastUpdatedText: '最終更新',
      darkModeSwitchLabel: 'テーマ',
      returnToTopLabel: 'トップへ戻る',
      sidebarMenuLabel: 'メニュー',
    },
    // 絶対 GitHub リンク（リポジトリ直下のソース参照）は外部リンクのため
    // デッドリンク検査の対象外にする。
    ignoreDeadLinks: [/^https?:\/\//],
  }),
);
