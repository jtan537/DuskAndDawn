using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/*
 * Class
 */
public class BlobShadowProjector : MonoBehaviour
{
    [SerializeField]
    private float _projectorFixedOffset = 2f;

    private Projector _blobShadowProjector;
    void Start()
    {
        _blobShadowProjector = gameObject.GetComponentInChildren<Projector>();
    }

    void Update()
    {
        RaycastHit hit;
        Ray downRay = new Ray(transform.position, Vector3.down);
        if (Physics.Raycast(downRay, out hit))
        {
            _blobShadowProjector.farClipPlane = _projectorFixedOffset + hit.distance;
        }
    }
}
