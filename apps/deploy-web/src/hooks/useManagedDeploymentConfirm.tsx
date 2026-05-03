export const useManagedDeploymentConfirm = () => {
  const closeDeploymentConfirm = async (_dseq: string[]) => {
    return true;
  };

  return { closeDeploymentConfirm };
};
