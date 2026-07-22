import React from 'react';
import { Globe2, LockKeyhole } from 'lucide-react';
import {
  POST_STATUS,
  POST_STATUS_LABELS,
  POST_VISIBILITY,
  POST_VISIBILITY_LABELS,
} from '../../types/posts';

const PostBadge = ({ type, value }) => {
  if (type === 'visibility') {
    return (
      <span className={`post-badge post-badge-visibility post-badge-${value.toLowerCase()}`}>
        {value === POST_VISIBILITY.PUBLIC ? <Globe2 size={13} /> : <LockKeyhole size={13} />}
        {POST_VISIBILITY_LABELS[value]}
      </span>
    );
  }

  return (
    <span className={`post-badge post-badge-status post-badge-${value.toLowerCase()}`}>
      {POST_STATUS_LABELS[value] || POST_STATUS_LABELS[POST_STATUS.DRAFT]}
    </span>
  );
};

export default PostBadge;
