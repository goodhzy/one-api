import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Image
} from 'semantic-ui-react';

const ImageTable = (props) => {
  const { imageList = [] } = props;
  console.log(imageList);
  return (
    <>
      <Table celled>
        <TableHeader>
          <TableRow textAlign={'center'}>
            <TableHeaderCell>正面</TableHeaderCell>
            <TableHeaderCell>反面</TableHeaderCell>
            <TableHeaderCell>合成图片</TableHeaderCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {imageList.map((image, index) => (
            <TableRow key={index}>
              <TableCell>
                <Image centered={true} src={image.front.url} size='small' />
              </TableCell>
              <TableCell>
                <Image centered={true} src={image.back.url} size='small' />
              </TableCell>
              <TableCell>
                <Image centered={true} src={image.result} size='small' />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};
export default ImageTable;