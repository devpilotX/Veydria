import { useRegisterActions } from 'kbar';
import { useTheme } from 'next-themes';

const useThemeSwitching = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleDarkLight = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const themeActions = [
    {
      id: 'toggleDarkLight',
      name: 'Toggle dark and light mode',
      shortcut: ['d', 'd'],
      section: 'Theme',
      perform: toggleDarkLight
    },
    {
      id: 'setLightTheme',
      name: 'Use light mode',
      section: 'Theme',
      perform: () => setTheme('light')
    },
    {
      id: 'setDarkTheme',
      name: 'Use dark mode',
      section: 'Theme',
      perform: () => setTheme('dark')
    },
    {
      id: 'setSystemTheme',
      name: 'Match system',
      section: 'Theme',
      perform: () => setTheme('system')
    }
  ];

  useRegisterActions(themeActions, [resolvedTheme]);
};

export default useThemeSwitching;
