import { Col, Row } from 'antd';
import React from 'react';
import { usePythPrice } from '../utils/pyth';
import FloatingElement from './layout/FloatingElement';
import { Title } from './styles';

export default function PythPrice() {
  // const context = useContext(PythContext);
  const pythPrice = usePythPrice()
  // const [pythPrice, setPythPrice] = useState<any>({price: undefined, confidence: undefined})

  // useEffect(()=> {
  //   const timer = setInterval(()=> setPythPrice(() => usePythPrice()), 1000)

  //   return () => clearInterval(timer)
  // })
  // const pythPrice = usePythPrice();
  
  return (
    <FloatingElement style={{ width: '300px', height: '120px' }}>
      <Title>Pyth Price</Title>
      <Row>
        <Col span={12} style={{ textAlign: 'left' }}>
          Price
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          {pythPrice.price?.toFixed(2)}
        </Col>
      </Row>
      <Row>
        <Col span={12} style={{ textAlign: 'left' }}>
          Confidence
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          {pythPrice.confidence?.toFixed(4)}
        </Col>
      </Row>
    </FloatingElement>
  );
}
