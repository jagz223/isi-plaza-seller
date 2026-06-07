import { Image, type ImageStyle } from 'expo-image';
import { memo, useMemo } from 'react';

import { catalogImageSource } from '@/utils/catalog-image-source';

type Props = {
  imageUrl: string;
  authHeaders: Record<string, string>;
  style: ImageStyle;
  imageId: number;
};

export const CatalogSavedImage = memo(function CatalogSavedImage({
  imageUrl,
  authHeaders,
  style,
  imageId,
}: Props) {
  const source = useMemo(
    () => catalogImageSource(imageUrl, authHeaders),
    [imageUrl, authHeaders],
  );

  return (
    <Image
      source={source}
      style={style}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={`catalog-${imageId}`}
    />
  );
});
