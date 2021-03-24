using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [SerializeField]
    private float speed = 10, rotateSpeed = 10;
    [SerializeField]
    private Transform movePoint;

    public Vector3 attemptedPosition;
    [SerializeField]
    private LayerMask obstacleMask;

    [SerializeField]
    Animator _anim;

    public bool isSliding = false;

    void Start()
    {
        movePoint.parent = null; // Detach partent
        attemptedPosition = movePoint.position;
    }

    private void OnDisable()
    {
        _anim.SetBool("isRunning", false);
    }

    void Update()
    {
        float movementAmout = speed * Time.deltaTime;
        transform.position = Vector3.MoveTowards(transform.position, movePoint.position, movementAmout);
        Vector3 diff = movePoint.position - transform.position;

        float rotationZ = Mathf.Atan2(diff.y, diff.x) * Mathf.Rad2Deg;
        if (diff != new Vector3(0, 0, 0))
        {
            transform.rotation = Quaternion.Euler(0, 0, rotationZ);
            isSliding = true;
            _anim.SetBool("isRunning", true);
        } else
        {
            isSliding = false;
            _anim.SetBool("isRunning", false);
        }
       

        if (Vector3.Distance(transform.position, movePoint.position) <= 0.05f)
        {
            if (Mathf.Abs(Input.GetAxisRaw("Horizontal")) == 1f)
            {
                attemptedPosition = movePoint.position;
                movePoint.position = Move(new Vector3(Input.GetAxisRaw("Horizontal"), 0, 0));
            }
            else if (Mathf.Abs(Input.GetAxisRaw("Vertical")) == 1f)
            {
                attemptedPosition = movePoint.position;
                movePoint.position = Move(new Vector3(0, Input.GetAxisRaw("Vertical"), 0));
            }
        }
    }

    private Vector3 Move(Vector3 direction)
    {
        Vector3 newPosition = attemptedPosition + direction;
        if (Physics2D.OverlapCircle(newPosition, 0.2f, obstacleMask))
        {
            return attemptedPosition;
        } else
        {
            attemptedPosition = newPosition;
            return Move(direction);
        }
    }
}
