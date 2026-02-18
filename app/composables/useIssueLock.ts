type LockStatus = {
  isLocked: boolean;
  lockedBy: { userId: number; username: string } | null;
  lockedAt: string | null;
};

export function useIssueLock(issueId: Ref<number>) {
  const api = useApi();
  const { userProfile } = useAuthStorage();
  const router = useRouter();

  const lockStatus = ref<LockStatus>({
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  });

  const isEditable = computed(() => {
    if (!lockStatus.value.isLocked) return true;
    if (lockStatus.value.lockedBy?.userId === userProfile.value?.UserId) return true;
    return false;
  });

  const checkLockStatus = async () => {
    try {
      const res: any = await api.getIssueLockStatus(issueId.value);
      lockStatus.value = {
        isLocked: res.isLocked ?? false,
        lockedBy: res.lockedBy ?? null,
        lockedAt: res.lockedAt ?? null,
      };
    } catch (err) {
      console.error("Failed to get lock status", err);
      lockStatus.value = { isLocked: false, lockedBy: null, lockedAt: null };
    }
  };

  const acquireLock = async () => {
    try {
      await api.lockIssue(issueId.value);
      await checkLockStatus();
    } catch (err: any) {
      // Lock failed, fetch current status
      if (err?.data?.isLocked) {
        lockStatus.value = err.data;
      } else {
        await checkLockStatus();
      }
    }
  };

  const releaseLock = async () => {
    try {
      await api.unlockIssue(issueId.value);
    } catch (err) {
      console.error("Failed to release lock", err);
    }
  };

  const heartbeatInterval = ref<ReturnType<typeof setInterval> | null>(null);

  const startHeartbeat = () => {
    if (heartbeatInterval.value) return;
    
    heartbeatInterval.value = setInterval(async () => {
      if (
        lockStatus.value.isLocked &&
        lockStatus.value.lockedBy?.userId === userProfile.value?.UserId
      ) {
        try {
          await api.heartbeatIssue(issueId.value);
        } catch (err) {
          console.error("Heartbeat failed", err);
        }
      }
    }, 30000); // Every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value);
      heartbeatInterval.value = null;
    }
  };

  // Initialize lock on mount
  const initLock = async () => {
    await checkLockStatus();
    
    // Only try to acquire lock if not already locked by someone else
    if (!lockStatus.value.isLocked) {
      await acquireLock();
    }
    
    startHeartbeat();
  };

  // Cleanup on unmount
  const cleanup = () => {
    stopHeartbeat();
    releaseLock();
  };

  // Handle page navigation - release lock
  router.beforeEach(() => {
    releaseLock();
  });

  // Handle beforeunload - release lock when closing tab
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      releaseLock();
    });
  }

  return {
    lockStatus,
    isEditable,
    checkLockStatus,
    acquireLock,
    releaseLock,
    initLock,
    cleanup,
    startHeartbeat,
    stopHeartbeat,
  };
}
