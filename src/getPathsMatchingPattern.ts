import FileHound from "filehound";

export const getPathsMatchingPattern = (patterns: string) => {
  const filehound = FileHound.create();
  return filehound
    .glob(patterns) 
    .find();
};
