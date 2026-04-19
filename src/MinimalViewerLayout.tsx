import React, { useEffect, useState, useCallback } from 'react';
import { HangingProtocolService } from '@ohif/core';
import { useAppConfig } from '@state';

function MinimalViewerLayout({
  extensionManager,
  servicesManager,
  commandsManager,
  viewports,
  ViewportGridComp,
}: withAppTypes): React.FunctionComponent {
  const [appConfig] = useAppConfig();
  const { hangingProtocolService, customizationService } = servicesManager.services;
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(appConfig.showLoadingIndicator);

  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );

  useEffect(() => {
    document.body.classList.add('bg-black');
    document.body.classList.add('overflow-hidden');

    return () => {
      document.body.classList.remove('bg-black');
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const getComponent = id => {
    const entry = extensionManager.getModuleEntry(id);

    if (!entry || !entry.component) {
      throw new Error(
        `${id} is not valid for an extension module or no component found from extension ${id}. Check your configuration.`
      );
    }

    return { entry };
  };

  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      () => {
        setShowLoadingIndicator(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [hangingProtocolService]);

  const getViewportComponentData = viewportComponent => {
    const { entry } = getComponent(viewportComponent.namespace);

    return {
      component: entry.component,
      isReferenceViewable: entry.isReferenceViewable,
      displaySetsToDisplay: viewportComponent.displaySetsToDisplay,
    };
  };

  const handleMouseEnter = () => {
    (document.activeElement as HTMLElement)?.blur();
  };

  const viewportComponents = viewports.map(getViewportComponentData);

  return (
    <div>
      <div
        className="relative flex w-full flex-row flex-nowrap items-stretch overflow-hidden bg-black"
        style={{ height: '100vh' }}
      >
        {showLoadingIndicator && <LoadingIndicatorProgress className="h-full w-full bg-black" />}
        <div className="flex h-full flex-1 flex-col">
          <div
            className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-black"
            onMouseEnter={handleMouseEnter}
          >
            <ViewportGridComp
              servicesManager={servicesManager}
              viewportComponents={viewportComponents}
              commandsManager={commandsManager}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MinimalViewerLayout;
