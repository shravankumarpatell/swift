// hooks/useWebContainer.ts
import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';
import { WebContainerManager } from './WebContainerManager';

export function useWebContainer() {
    const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        const initializeWebContainer = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const manager = WebContainerManager.getInstance();
                const container = await manager.getWebContainer();
                
                if (isMounted) {
                    setWebContainer(container);
                }
            } catch (err) {
                console.error('Failed to initialize WebContainer:', err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to initialize WebContainer');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        initializeWebContainer();

        return () => {
            isMounted = false;
        };
    }, []);

    return {
        webContainer,
        isLoading,
        error,
        manager: WebContainerManager.getInstance()
    };
}