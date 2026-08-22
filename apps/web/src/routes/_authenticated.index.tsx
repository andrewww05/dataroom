import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';

export const Route = createFileRoute('/_authenticated/')({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { dataRoom } = useAuth();

  if (dataRoom?.rootId) {
    return <Navigate to="/f/$folderId" params={{ folderId: dataRoom.rootId }} replace />;
  }

  return null;
}
