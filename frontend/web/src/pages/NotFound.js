import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';

const NotFound = () => {
  return (
    <Container fluid>
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} sm={10} md={8} lg={6} className="text-center">
          <h1 className="display-1 fw-bold">404</h1>
          <h3 className="mb-4">Page Not Found</h3>
          <p className="text-muted mb-5">
            The page you are looking for might have been removed, had its name changed,
            or is temporarily unavailable.
          </p>
          <Button
            as={Link}
            to="/"
            variant="primary"
            size="lg"
            className="px-5 py-3"
          >
            Go Back Home
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound; 