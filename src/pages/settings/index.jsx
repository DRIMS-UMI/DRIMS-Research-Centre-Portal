import React, { useState, useEffect, useRef } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { RiNotificationLine, RiLockLine, RiUserLine, RiGlobalLine, RiCloseLine, RiInformationLine } from 'react-icons/ri';
import { Eye, EyeOff, Loader2, RotateCcw } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';
import { useAuth } from '../../store/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { useGetLoggedInUserDetails } from '../../store/tanstackStore/services/queries';
import { useMutation } from '@tanstack/react-query';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useWhatsNew } from '../../components/WhatsNewContext';
import { updateUserProfileService, changePasswordService } from '../../store/tanstackStore/services/api';

const APP_INFO = __APP_VERSION__;

const UPDATE_CHECK_TIMEOUT = 8000;
const UPDATE_CHECK_INTERVAL = 100;

const formatBuildDate = (iso) => {
  if (!iso) return 'Not available';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const SettingSection = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Icon className="w-5 h-5 text-primary-500" />
      </div>
      <h2 className="text-lg font-medium text-semantic-text-primary">{title}</h2>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user } = useAuth();
  const { data: userData, isLoading } = useGetLoggedInUserDetails();
 
  const { openHistory } = useWhatsNew();
  const [previousBuild] = useState(() => localStorage.getItem('umi_prev_app_version'));

  const [updateStatus, setUpdateStatus] = useState('idle');
  const swSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  // Instantiated purely as a listener so needRefresh flips when a new build lands.
  // The registration used for update() comes from navigator.serviceWorker.ready instead,
  // which is always populated regardless of whether this hook has finished mounting.
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  const needRefreshRef = useRef(needRefresh);
  useEffect(() => {
    needRefreshRef.current = needRefresh;
  }, [needRefresh]);

  useEffect(() => {
    if (!needRefresh) return;
    setUpdateStatus((status) => (status === 'checking' ? status : 'available'));
  }, [needRefresh]);
  const [userDetails, setUserDetails] = useState({
    title: '',
    name: '',
    email: '',
    phone: '',
    designation: '',
    disableEmailNotifications: false
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editedUserDetails, setEditedUserDetails] = useState({...userDetails});
  const [passwordDetails, setPasswordDetails] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfileService,
    onSuccess: () => {
      setUserDetails(editedUserDetails);
      setEditModalOpen(false);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message);
      console.error('Error updating profile:', error);
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePasswordService,
    onSuccess: () => {
      setPasswordModalOpen(false);
      setPasswordDetails({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message);
      console.error('Error updating password:', error);
    }
  });

  useEffect(() => {
    if (userData) {
      const details = {
        title: userData?.user?.title || '',
        name: userData?.user?.name || '',
        email: userData?.user?.email || '',
        phone: userData?.user?.phone || '',
        designation: userData?.user?.designation || '',
        disableEmailNotifications: userData?.user?.disableEmailNotifications || false
      };
      setUserDetails(details);
      setEditedUserDetails(details);
    }
  }, [userData]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateProfileMutation.mutateAsync(editedUserDetails);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordDetails.newPassword !== passwordDetails.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordDetails.currentPassword,
        newPassword: passwordDetails.newPassword
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckForUpdates = async () => {
    if (!swSupported) return;
    setUpdateStatus('checking');
    setNeedRefresh(false);

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();

      // registerType is 'prompt', so a new build lands as a waiting worker and the
      // hook above flips needRefresh. Poll briefly for that rather than reporting
      // "up to date" the instant update() resolves, which it does even when the
      // fetched service worker is byte-identical to the active one.
      let waited = 0;
      while (!needRefreshRef.current && waited < UPDATE_CHECK_TIMEOUT) {
        await new Promise((resolve) => setTimeout(resolve, UPDATE_CHECK_INTERVAL));
        waited += UPDATE_CHECK_INTERVAL;
      }

      setUpdateStatus(needRefreshRef.current ? 'available' : 'up-to-date');
    } catch (error) {
      console.error('Update check failed:', error);
      setUpdateStatus('error');
    }
  };

  const handleApplyUpdate = async () => {
    setUpdateStatus('applying');
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Applying update failed:', error);
    }
    // The automatic reload is attached to a `controlling` listener that only binds when
    // this component's own hook observes the `waiting` event. If PWAUpdateToast detected
    // the update first that listener never attaches, so reload explicitly instead.
    setTimeout(() => window.location.reload(), 800);
  };

  const handleHardReset = async () => {
    if (!swSupported) return;
    const confirmed = window.confirm(
      'This clears the app cache and signs you out. Your records are not affected. Continue?'
    );
    if (!confirmed) return;

    setUpdateStatus('resetting');
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
    window.location.reload();
  };

  const updateBusy = ['checking', 'applying', 'resetting'].includes(updateStatus);
  const updateButtonLabel = {
    idle: 'Check for updates',
    checking: 'Checking...',
    'up-to-date': 'Check again',
    available: 'Update now',
    applying: 'Updating...',
    resetting: 'Clearing...',
    error: 'Try again',
  }[updateStatus];

  return (
    <div className="p-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account settings and preferences"
      />

      <div className="grid gap-6">
        {/* Profile Settings */}
        <SettingSection icon={RiUserLine} title="Profile Settings">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-semantic-text-primary">Personal Information</h3>
                <button 
                  className="px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-md hover:bg-blue-50"
                  onClick={() => {
                    setEditedUserDetails({...userDetails});
                    setEditModalOpen(true);
                  }}
                >
                  Edit
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Title</p>
                    <p className="text-sm font-medium">{userDetails.title || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Full Name</p>
                    <p className="text-sm font-medium">{userDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Email</p>
                    <p className="text-sm font-medium">{userDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Phone</p>
                    <p className="text-sm font-medium">{userDetails.phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Designation</p>
                    <p className="text-sm font-medium">{userDetails.designation || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SettingSection>

        {/* Security Settings */}
        <SettingSection icon={RiLockLine} title="Security Settings">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-semantic-text-primary">Password</h3>
              <p className="text-sm text-semantic-text-secondary">Change your password</p>
            </div>
            <button 
              className="px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-md hover:bg-blue-50"
              onClick={() => setPasswordModalOpen(true)}
            >
              Update
            </button>
          </div>
         
        </SettingSection>

        {/* Notification Settings */}
        <SettingSection icon={RiNotificationLine} title="Notification Settings">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-semantic-text-primary">Email Notifications</h3>
                <p className="text-sm text-semantic-text-secondary">Receive email updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={!userDetails.disableEmailNotifications}
                  onChange={async (e) => {
                    const newDisableStatus = !e.target.checked;
                    // Optimistically update
                    setUserDetails(prev => ({...prev, disableEmailNotifications: newDisableStatus}));
                    setEditedUserDetails(prev => ({...prev, disableEmailNotifications: newDisableStatus}));
                    try {
                      await updateProfileMutation.mutateAsync({
                        ...userDetails,
                        disableEmailNotifications: newDisableStatus
                      });
                    } catch (error) {
                      // Revert on error
                      setUserDetails(prev => ({...prev, disableEmailNotifications: !newDisableStatus}));
                      setEditedUserDetails(prev => ({...prev, disableEmailNotifications: !newDisableStatus}));
                    }
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </SettingSection>

        {/* About */}
        <SettingSection icon={RiInformationLine} title="About">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-semantic-text-secondary">App version</p>
              <p className="text-sm font-medium">{APP_INFO?.version && APP_INFO.version !== '0.0.0' ? `v${APP_INFO.version}` : 'DRIMS Research Centre Portal'}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-semantic-text-secondary">Build date</p>
              <p className="text-sm font-medium">{formatBuildDate(APP_INFO?.build)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-semantic-text-secondary">Previous build</p>
              <p className="text-sm font-medium">
                {previousBuild && previousBuild !== APP_INFO?.build ? formatBuildDate(previousBuild) : 'First install'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-semantic-text-secondary">App updates</p>
              <button
                className="px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-md hover:bg-blue-50 flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-transparent"
                onClick={updateStatus === 'available' ? handleApplyUpdate : handleCheckForUpdates}
                disabled={!swSupported || updateBusy}
              >
                {updateBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                {updateButtonLabel}
              </button>
            </div>
            {updateStatus === 'up-to-date' && (
              <p className="text-xs text-semantic-text-secondary">
                You&apos;re on the latest version.
              </p>
            )}
            {updateStatus === 'error' && (
              <p className="text-xs text-red-600">
                Could not reach the update service. Check your connection and try again.
              </p>
            )}
            {!swSupported && (
              <p className="text-xs text-semantic-text-secondary">
                This browser manages app updates automatically.
              </p>
            )}
            {swSupported && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-semantic-text-secondary">Still not updating?</p>
                <button
                  className="text-sm text-semantic-text-secondary hover:text-primary-500 flex items-center gap-1.5"
                  onClick={handleHardReset}
                  disabled={updateBusy}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear cache &amp; reload
                </button>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm text-semantic-text-secondary">Release notes</p>
              <button
                className="px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-md hover:bg-blue-50"
                onClick={openHistory}
              >
                What&apos;s new
              </button>
            </div>
          </div>
        </SettingSection>

        {/* System Settings */}
        {/* <SettingSection icon={RiGlobalLine} title="System Settings">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-semantic-text-primary">Language</h3>
              <p className="text-sm text-semantic-text-secondary">Select your preferred language</p>
            </div>
            <select className="px-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-semantic-text-primary">Time Zone</h3>
              <p className="text-sm text-semantic-text-secondary">Set your local time zone</p>
            </div>
            <select className="px-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="utc">UTC</option>
              <option value="est">EST</option>
              <option value="pst">PST</option>
            </select>
          </div>
        </SettingSection> */}
      </div>

      {/* Edit Profile Modal */}
      <Modal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        title="Edit Profile Information"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              id="title"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none"
              value={editedUserDetails.title}
              onChange={(e) => setEditedUserDetails({...editedUserDetails, title: e.target.value})}
            />
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              id="name"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none"
              value={editedUserDetails.name}
              onChange={(e) => setEditedUserDetails({...editedUserDetails, name: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <PhoneInput
              id="phone"
              value={editedUserDetails.phone}
              onChange={(e) => setEditedUserDetails({...editedUserDetails, phone: e.target.value})}
              placeholder="770000000"
            />
          </div>
          
          <div>
            <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <input
              type="text"
              id="designation"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none"
              value={editedUserDetails.designation}
              onChange={(e) => setEditedUserDetails({...editedUserDetails, designation: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal 
        isOpen={passwordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
        title="Change Password"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none pr-10"
                value={passwordDetails.currentPassword}
                onChange={(e) => setPasswordDetails({...passwordDetails, currentPassword: e.target.value})}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none pr-10"
                value={passwordDetails.newPassword}
                onChange={(e) => setPasswordDetails({...passwordDetails, newPassword: e.target.value})}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none pr-10"
                value={passwordDetails.confirmPassword}
                onChange={(e) => setPasswordDetails({...passwordDetails, confirmPassword: e.target.value})}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordDetails.newPassword !== passwordDetails.confirmPassword && 
              passwordDetails.confirmPassword && 
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            }
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 flex items-center justify-center gap-2"
              disabled={isSubmitting || (passwordDetails.newPassword !== passwordDetails.confirmPassword && passwordDetails.confirmPassword)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
