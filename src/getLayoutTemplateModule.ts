import MinimalViewerLayout from './MinimalViewerLayout';

export default function ({ servicesManager, extensionManager, commandsManager, hotkeysManager }) {
  function MinimalViewerLayoutWithServices(props) {
    return MinimalViewerLayout({
      servicesManager,
      extensionManager,
      commandsManager,
      hotkeysManager,
      ...props,
    });
  }

  return [
    {
      name: 'minimalLayout',
      id: 'minimalLayout',
      component: MinimalViewerLayoutWithServices,
    },
  ];
}
